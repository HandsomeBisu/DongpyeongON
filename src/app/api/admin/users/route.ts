import { apiError, verifyApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const admin = await verifyApiRequest(request); if (admin.role !== "admin") throw new Error("FORBIDDEN");
    const snapshot = await getAdminDb().collection("users").orderBy("createdAt", "desc").limit(100).get();
    return Response.json({ users: snapshot.docs.map((doc) => { const data = doc.data(); return { uid: doc.id, displayName: data.displayName, email: data.email, role: data.role ?? "student" }; }) });
  } catch (error) { return apiError(error); }
}
