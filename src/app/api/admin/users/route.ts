import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const snapshot = await getAdminDb().collection("users").orderBy("createdAt", "desc").limit(100).get();
    return Response.json({ users: snapshot.docs.map((doc) => { const data = doc.data(); return { uid: doc.id, displayName: data.displayName, email: data.email, role: data.role ?? "student" }; }) });
  } catch (error) { return apiError(error); }
}
