import { Timestamp } from "firebase-admin/firestore";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const snapshot = await getAdminDb()
      .collection("reports")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return Response.json({
      reports: snapshot.docs.map((document) => {
        const data = document.data();
        const date = (value: unknown) =>
          value instanceof Timestamp ? value.toDate().toISOString() : null;
        return {
          id: document.id,
          targetType: data.targetType === "comment" ? "comment" : "post",
          postId: data.postId,
          commentId: data.commentId ?? null,
          targetTitle: data.targetTitle ?? "게시물",
          targetContent: data.targetContent ?? "",
          reporterId: data.reporterId,
          reason: data.reason,
          detail: data.detail ?? "",
          status: data.status === "resolved" ? "resolved" : "pending",
          action: data.action ?? null,
          resolutionReason: data.resolutionReason ?? "",
          createdAt: date(data.createdAt),
          resolvedAt: date(data.resolvedAt),
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
