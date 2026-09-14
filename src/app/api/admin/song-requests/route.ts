import { Timestamp } from "firebase-admin/firestore";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

function date(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const snapshot = await getAdminDb().collection("songRequests").orderBy("createdAt", "desc").limit(100).get();
    return Response.json({ requests: snapshot.docs.map((document) => { const data = document.data(); return { id: document.id, ...data, createdAt: date(data.createdAt), updatedAt: date(data.updatedAt), approvedAt: date(data.approvedAt), rejectedAt: date(data.rejectedAt), playedAt: date(data.playedAt), limitResetsAt: date(data.limitResetsAt) }; }) });
  } catch (error) {
    return apiError(error);
  }
}
