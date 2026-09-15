import { notFound } from "next/navigation";
import { PostDetail } from "@/components/community/post-detail";
import { isPostId } from "@/lib/post-id";

const LEGACY_POST_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  if (!isPostId(postId) && !LEGACY_POST_ID_PATTERN.test(postId)) notFound();
  return <PostDetail postId={postId} />;
}
