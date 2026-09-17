import { Timestamp } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

function serializeDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function GET(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const db = getAdminDb();
    const [postsSnapshot, commentsSnapshot] = await Promise.all([
      db
        .collection("posts")
        .where("authorId", "==", user.uid)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
      db
        .collectionGroup("comments")
        .where("authorId", "==", user.uid)
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
    ]);

    const commentPostIds = [
      ...new Set(
        commentsSnapshot.docs
          .map((comment) => comment.ref.parent.parent?.id)
          .filter((postId): postId is string => Boolean(postId)),
      ),
    ];
    const postDocuments = commentPostIds.length
      ? await db.getAll(
          ...commentPostIds.map((postId) => db.collection("posts").doc(postId)),
        )
      : [];
    const commentPosts = new Map(
      postDocuments.map((post) => [post.id, post.data()]),
    );

    return Response.json({
      posts: postsSnapshot.docs.map((post) => {
        const data = post.data();
        return {
          id: post.id,
          title: data.title ?? "제목 없는 게시물",
          category: data.category ?? "게시판",
          createdAt: serializeDate(data.createdAt),
        };
      }),
      comments: commentsSnapshot.docs.flatMap((comment) => {
        const postId = comment.ref.parent.parent?.id;
        if (!postId) return [];
        const post = commentPosts.get(postId);
        if (!post || post.status !== "published") return [];
        const data = comment.data();
        return [
          {
            id: comment.id,
            postId,
            postTitle: post.title ?? "게시물",
            content: data.content ?? "",
            createdAt: serializeDate(data.createdAt),
          },
        ];
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
