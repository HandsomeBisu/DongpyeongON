import { CommentReport } from "@/components/community/comment-report";
import { notFound } from "next/navigation";
import { isPostId } from "@/lib/post-id";

const LEGACY_POST_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

export default async function CommentReportPage({
  params,
}: {
  params: Promise<{ postId: string; commentId: string }>;
}) {
  const { postId, commentId } = await params;
  if (!isPostId(postId) && !LEGACY_POST_ID_PATTERN.test(postId)) notFound();
  return <CommentReport postId={postId} commentId={commentId} />;
}
