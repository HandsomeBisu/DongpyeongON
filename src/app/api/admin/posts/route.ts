import { Timestamp } from "firebase-admin/firestore";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const snapshot = await getAdminDb().collection("posts").orderBy("createdAt", "desc").limit(100).get();
    return Response.json({ posts: snapshot.docs.map((document) => { const data = document.data(); return { id: document.id, title: data.title, category: data.category, authorNickname: data.authorNickname, status: data.status, likeCount: data.likeCount ?? 0, commentCount: data.commentCount ?? 0, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null }; }) });
  } catch (error) {
    return apiError(error);
  }
}
