import { PostDetail } from "@/components/community/post-detail";
export default async function Page({ params }: { params: Promise<{ postId: string }> }) { return <PostDetail postId={(await params).postId} />; }
