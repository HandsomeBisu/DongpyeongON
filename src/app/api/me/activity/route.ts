import { Timestamp } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

type ActivityPost = {
  id: string;
  title: string;
  category: string;
  createdAt: string | null;
};

type ActivityComment = {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  createdAt: string | null;
};

function serializeDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function newestFirst<T extends { createdAt: string | null }>(items: T[]) {
  return items.sort((left, right) =>
    (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
  );
}

function needsIndex(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? String(error.message) : "";
  return (
    code === 9 ||
    code === "failed-precondition" ||
    message.toLowerCase().includes("index")
  );
}

async function loadIndexedActivity(uid: string) {
  const db = getAdminDb();
  const [postsSnapshot, commentsSnapshot] = await Promise.all([
    db
      .collection("posts")
      .where("authorId", "==", uid)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get(),
    db
      .collectionGroup("comments")
      .where("authorId", "==", uid)
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

  const posts: ActivityPost[] = postsSnapshot.docs.map((post) => {
    const data = post.data();
    return {
      id: post.id,
      title: data.title ?? "제목 없는 게시물",
      category: data.category ?? "게시판",
      createdAt: serializeDate(data.createdAt),
    };
  });
  const comments: ActivityComment[] = commentsSnapshot.docs.flatMap(
    (comment) => {
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
    },
  );
  return { posts, comments };
}

async function loadActivityWithoutCompositeIndexes(uid: string) {
  const db = getAdminDb();
  const postsSnapshot = await db
    .collection("posts")
    .select("authorId", "category", "createdAt", "status", "title")
    .get();
  const publishedPosts = postsSnapshot.docs.filter(
    (post) => post.data().status === "published",
  );
  const posts: ActivityPost[] = publishedPosts
    .filter((post) => post.data().authorId === uid)
    .map((post) => ({
      id: post.id,
      title: post.data().title ?? "제목 없는 게시물",
      category: post.data().category ?? "게시판",
      createdAt: serializeDate(post.data().createdAt),
    }));
  const comments: ActivityComment[] = [];

  for (let offset = 0; offset < publishedPosts.length; offset += 20) {
    const postGroup = publishedPosts.slice(offset, offset + 20);
    const commentGroups = await Promise.all(
      postGroup.map((post) =>
        post.ref
          .collection("comments")
          .where("authorId", "==", uid)
          .limit(50)
          .get(),
      ),
    );
    commentGroups.forEach((snapshot, index) => {
      const post = postGroup[index];
      const postData = post.data();
      snapshot.docs.forEach((comment) => {
        const data = comment.data();
        if (data.status !== "published") return;
        comments.push({
          id: comment.id,
          postId: post.id,
          postTitle: postData.title ?? "게시물",
          content: data.content ?? "",
          createdAt: serializeDate(data.createdAt),
        });
      });
    });
  }

  return {
    posts: newestFirst(posts).slice(0, 50),
    comments: newestFirst(comments).slice(0, 50),
  };
}

export async function GET(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    try {
      return Response.json(await loadIndexedActivity(user.uid));
    } catch (error) {
      if (!needsIndex(error)) throw error;
      console.warn(
        "My activity indexes are not ready; using the index-free fallback.",
        error,
      );
      return Response.json(await loadActivityWithoutCompositeIndexes(user.uid));
    }
  } catch (error) {
    console.error("Failed to load my activity", error);
    return apiError(error);
  }
}
