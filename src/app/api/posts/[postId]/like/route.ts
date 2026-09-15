import { FieldValue } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import {
  COMMUNITY_DISABLED_MESSAGE,
  COMMUNITY_ENABLED,
} from "@/lib/community-availability";
import { getAdminDb } from "@/lib/firebase/admin";
import { createNotification, safelyNotify } from "@/lib/notifications";

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
    const { postId } = await params;
    const db = getAdminDb();
    const postRef = db.collection("posts").doc(postId);
    const likeRef = postRef.collection("likes").doc(user.uid);
    let postAuthorId = "";
    let postTitle = "";
    const liked = await db.runTransaction(async (transaction) => {
      const [post, like] = await Promise.all([
        transaction.get(postRef),
        transaction.get(likeRef),
      ]);
      if (!post.exists || post.data()?.status !== "published")
        throw new Error("NOT_FOUND");
      postAuthorId = String(post.data()?.authorId ?? "");
      postTitle = String(post.data()?.title ?? "게시물");
      if (like.exists) {
        transaction.delete(likeRef);
        transaction.update(postRef, { likeCount: FieldValue.increment(-1) });
        return false;
      }
      transaction.set(likeRef, {
        userId: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, { likeCount: FieldValue.increment(1) });
      return true;
    });
    if (liked)
      await safelyNotify(() =>
        createNotification({
          recipientId: postAuthorId,
          actorId: user.uid,
          type: "post_like",
          title: `${typeof profile.name === "string" ? profile.name : "누군가"}님이 내 게시물을 좋아해요.`,
          body: postTitle,
          href: `/post/${postId}`,
        }),
      );
    return Response.json({ liked });
  } catch (error) {
    return apiError(error);
  }
}
