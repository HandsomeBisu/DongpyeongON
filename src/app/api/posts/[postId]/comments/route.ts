import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import {
  COMMUNITY_DISABLED_MESSAGE,
  COMMUNITY_ENABLED,
} from "@/lib/community-availability";
import { getAdminDb } from "@/lib/firebase/admin";

const schema = z.object({ content: z.string().trim().min(1).max(1000) });
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  if (!COMMUNITY_ENABLED)
    return Response.json(
      { error: COMMUNITY_DISABLED_MESSAGE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  try {
    const { user, profile } = await verifyOnboardedApiRequest(request);
    const input = schema.parse(await request.json());
    const { postId } = await params;
    const db = getAdminDb();
    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc();
    await db.runTransaction(async (transaction) => {
      const post = await transaction.get(postRef);
      if (!post.exists || post.data()?.status !== "published")
        throw new Error("NOT_FOUND");
      transaction.set(commentRef, {
        content: input.content,
        authorId: user.uid,
        authorNickname:
          typeof profile.name === "string"
            ? profile.name
            : user.name || "동평 학생",
        status: "published",
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, { commentCount: FieldValue.increment(1) });
    });
    return Response.json({ id: commentRef.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
