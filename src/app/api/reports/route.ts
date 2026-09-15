import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { createNotification, safelyNotify } from "@/lib/notifications";

const schema = z.object({
  targetType: z.enum(["post", "comment"]).default("post"),
  postId: z.string().min(1),
  commentId: z.string().min(1).optional(),
  reason: z.enum([
    "욕설·비방",
    "개인정보 노출",
    "광고·도배",
    "부적절한 내용",
    "기타",
  ]),
  detail: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json({ error: "신고 내용을 확인해 주세요." }, { status: 400 });
    const input = parsed.data;
    if (input.targetType === "comment" && !input.commentId)
      return Response.json({ error: "신고할 댓글을 확인해 주세요." }, { status: 400 });

    const db = getAdminDb();
    const post = await db.collection("posts").doc(input.postId).get();
    if (!post.exists || post.data()?.status !== "published")
      throw new Error("NOT_FOUND");

    let targetAuthorId = String(post.data()?.authorId ?? "");
    let targetContent = String(post.data()?.content ?? "");
    if (input.targetType === "comment") {
      const comment = await post.ref
        .collection("comments")
        .doc(input.commentId!)
        .get();
      if (!comment.exists || comment.data()?.status !== "published")
        return Response.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
      targetAuthorId = String(comment.data()?.authorId ?? "");
      targetContent = String(comment.data()?.content ?? "");
    }

    const targetId =
      input.targetType === "post" ? input.postId : input.commentId!;
    const id = `${input.targetType}_${targetId}_${user.uid}`;
    await db.collection("reports").doc(id).set({
      ...input,
      commentId: input.commentId ?? null,
      targetAuthorId,
      targetTitle: String(post.data()?.title ?? "게시물"),
      targetContent,
      reporterId: user.uid,
      status: "pending",
      action: null,
      resolutionReason: null,
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await safelyNotify(() =>
      createNotification({
        recipientId: user.uid,
        type: "report_received",
        title: "신고가 정상적으로 접수됐어요.",
        body: `${input.targetType === "post" ? "게시물" : "댓글"} 신고 · ${input.reason}`,
        href: `/post/${input.postId}`,
      }),
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
