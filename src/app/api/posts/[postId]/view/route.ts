import { FieldValue } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import {
  COMMUNITY_DISABLED_MESSAGE,
  COMMUNITY_ENABLED,
} from "@/lib/community-availability";
import { getAdminDb } from "@/lib/firebase/admin";

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
    const { user } = await verifyOnboardedApiRequest(request);
    const { postId } = await params;
    const db = getAdminDb();
    const postRef = db.collection("posts").doc(postId);
    const viewRef = postRef.collection("views").doc(user.uid);

    const counted = await db.runTransaction(async (transaction) => {
      const [post, view] = await Promise.all([
        transaction.get(postRef),
        transaction.get(viewRef),
      ]);
      if (!post.exists || post.data()?.status !== "published")
        throw new Error("NOT_FOUND");
      if (view.exists) return false;

      transaction.set(viewRef, {
        userId: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, { viewCount: FieldValue.increment(1) });
      return true;
    });

    return Response.json({ counted });
  } catch (error) {
    return apiError(error);
  }
}
