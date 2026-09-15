import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { createNotification, safelyNotify } from "@/lib/notifications";

const schema = z.object({
  action: z.enum(["delete", "edit", "dismiss"]),
  resolutionReason: z.string().trim().min(2).max(500),
  content: z.string().trim().max(5000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json(
        { error: "처리 방식과 사유를 확인해 주세요." },
        { status: 400 },
      );
    if (parsed.data.action === "edit" && !parsed.data.content)
      return Response.json(
        { error: "강제로 적용할 내용을 입력해 주세요." },
        { status: 400 },
      );

    const { reportId } = await params;
    const db = getAdminDb();
    const reportRef = db.collection("reports").doc(reportId);
    let reporterId = "";
    let postId = "";
    let targetLabel = "게시물";
    await db.runTransaction(async (transaction) => {
      const report = await transaction.get(reportRef);
      if (!report.exists || report.data()?.status !== "pending")
        throw new Error("REPORT_NOT_FOUND");
      const data = report.data()!;
      reporterId = String(data.reporterId ?? "");
      postId = String(data.postId ?? "");
      const postRef = db.collection("posts").doc(postId);
      const targetType = data.targetType === "comment" ? "comment" : "post";
      targetLabel = targetType === "comment" ? "댓글" : "게시물";
      if (
        parsed.data.action === "edit" &&
        targetType === "comment" &&
        (parsed.data.content?.length ?? 0) > 1000
      )
        throw new Error("CONTENT_TOO_LONG");

      if (parsed.data.action === "delete") {
        if (targetType === "post") {
          transaction.update(postRef, {
            status: "deleted",
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          const commentRef = postRef
            .collection("comments")
            .doc(String(data.commentId));
          const comment = await transaction.get(commentRef);
          if (comment.exists && comment.data()?.status === "published") {
            transaction.update(commentRef, {
              status: "deleted",
              updatedAt: FieldValue.serverTimestamp(),
            });
            transaction.update(postRef, {
              commentCount: FieldValue.increment(-1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      if (parsed.data.action === "edit") {
        if (targetType === "post") {
          transaction.update(postRef, {
            content: parsed.data.content,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          const commentRef = postRef
            .collection("comments")
            .doc(String(data.commentId));
          transaction.update(commentRef, {
            content: parsed.data.content,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      transaction.update(reportRef, {
        status: "resolved",
        action: parsed.data.action,
        resolutionReason: parsed.data.resolutionReason,
        resolvedContent:
          parsed.data.action === "edit" ? parsed.data.content : null,
        resolvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await safelyNotify(() =>
      createNotification({
        recipientId: reporterId,
        type: "report_resolved",
        title: "신고 처리 결과가 도착했어요.",
        body: `${targetLabel} 신고 · ${parsed.data.resolutionReason}`,
        href: parsed.data.action === "delete" ? "" : `/post/${postId}`,
      }),
    );
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND")
      return Response.json(
        { error: "이미 처리됐거나 존재하지 않는 신고예요." },
        { status: 404 },
      );
    if (error instanceof Error && error.message === "CONTENT_TOO_LONG")
      return Response.json(
        { error: "댓글은 1,000자 이하로 수정해 주세요." },
        { status: 400 },
      );
    return apiError(error);
  }
}
