import { notFound } from "next/navigation";
import { PostDetail } from "@/components/community/post-detail";
import { isPostId } from "@/lib/post-id";

const LEGACY_POST_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ comment?: string | string[] }>;
}) {
  const { postId } = await params;
  const requestedComment = (await searchParams).comment;
  const focusCommentId =
    typeof requestedComment === "string" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(requestedComment)
      ? requestedComment
      : undefined;
  if (!isPostId(postId) && !LEGACY_POST_ID_PATTERN.test(postId)) notFound();
  return <PostDetail postId={postId} focusCommentId={focusCommentId} />;
}
