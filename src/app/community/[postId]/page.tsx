import { redirect } from "next/navigation";

export default async function LegacyPostPage({
  params,
}: PageProps<"/community/[postId]">) {
  const { postId } = await params;
  redirect(`/post/${postId}`);
}
