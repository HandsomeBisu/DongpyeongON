import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { z } from "zod";
import { getFirebaseClient } from "@/lib/firebase/client";

export const POST_CATEGORIES = [
  "자유게시판",
  "질문게시판",
  "학생회 공지",
] as const;
export const postInputSchema = z.object({
  title: z.string().trim().min(2, "제목은 2자 이상 입력해 주세요.").max(80),
  content: z.string().trim().min(5, "내용은 5자 이상 입력해 주세요.").max(5000),
  category: z.enum(POST_CATEGORIES),
});
export type PostInput = z.infer<typeof postInputSchema>;
export interface CommunityPost extends PostInput {
  id: string;
  authorId: string;
  authorNickname: string;
  status: "published" | "hidden" | "deleted";
  likeCount: number;
  commentCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
export interface PostComment {
  id: string;
  content: string;
  authorId: string;
  authorNickname: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
function mapPost(snapshot: {
  id: string;
  data: () => DocumentData;
}): CommunityPost {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    content: data.content,
    category: data.category,
    authorId: data.authorId,
    authorNickname: data.authorNickname,
    status: data.status,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}
export function subscribeToPosts(
  onData: (posts: CommunityPost[]) => void,
  onError: () => void,
) {
  const { db } = getFirebaseClient();
  return onSnapshot(
    query(
      collection(db, "posts"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(30),
    ),
    (snapshot) => onData(snapshot.docs.map(mapPost)),
    onError,
  );
}
export function subscribeToPost(
  id: string,
  onData: (post: CommunityPost | null) => void,
  onError: () => void,
) {
  const { db } = getFirebaseClient();
  return onSnapshot(
    doc(db, "posts", id),
    (s) => onData(s.exists() ? mapPost(s) : null),
    onError,
  );
}
export function subscribeToComments(
  postId: string,
  onData: (comments: PostComment[]) => void,
) {
  const ref = collection(getFirebaseClient().db, "posts", postId, "comments");
  return onSnapshot(
    query(ref, where("status", "==", "published"), orderBy("createdAt", "asc")),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) => ({
          id: item.id,
          content: item.data().content,
          authorId: item.data().authorId,
          authorNickname: item.data().authorNickname,
          createdAt: item.data().createdAt ?? null,
          updatedAt: item.data().updatedAt ?? null,
        })),
      ),
  );
}
export function subscribeToMyLike(
  postId: string,
  uid: string,
  onData: (liked: boolean) => void,
) {
  return onSnapshot(
    doc(getFirebaseClient().db, "posts", postId, "likes", uid),
    (snapshot) => onData(snapshot.exists()),
  );
}
export async function updatePost(id: string, input: PostInput) {
  await updateDoc(doc(getFirebaseClient().db, "posts", id), {
    ...postInputSchema.parse(input),
    updatedAt: serverTimestamp(),
  });
}
export async function archivePost(id: string) {
  await updateDoc(doc(getFirebaseClient().db, "posts", id), {
    status: "deleted",
    updatedAt: serverTimestamp(),
  });
}
export function formatPostDate(value: Timestamp | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value.toDate())
    : "방금 전";
}
