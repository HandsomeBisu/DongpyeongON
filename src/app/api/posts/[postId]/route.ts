import { Timestamp } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { canViewPost } from "@/lib/post-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { profile } = await verifyOnboardedApiRequest(request);
    const { postId } = await params;
    const snapshot = await getAdminDb().collection("posts").doc(postId).get();
    const data = snapshot.data();

    if (
      !snapshot.exists ||
      !data ||
      !canViewPost(data.status, profile.role)
    )
      throw new Error("NOT_FOUND");

    return Response.json({
      post: {
        id: snapshot.id,
        title: typeof data.title === "string" ? data.title : "",
        content: typeof data.content === "string" ? data.content : "",
        category: data.category,
        authorId: data.authorId,
        authorNickname: data.authorNickname,
        status: data.status,
        likeCount: data.likeCount ?? 0,
        commentCount: data.commentCount ?? 0,
        viewCount: data.viewCount ?? 0,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : null,
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
