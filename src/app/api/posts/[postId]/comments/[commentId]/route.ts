import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const updateSchema = z.object({
  content: z.string().trim().min(1, "댓글 내용을 입력해 주세요.").max(1000),
});

type Context = {
  params: Promise<{ postId: string; commentId: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "댓글을 확인해 주세요." },
        { status: 400 },
      );
    const { postId, commentId } = await params;
    const reference = getAdminDb()
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const comment = await reference.get();
    if (!comment.exists || comment.data()?.status !== "published")
      throw new Error("COMMENT_NOT_FOUND");
    if (comment.data()?.authorId !== user.uid) throw new Error("FORBIDDEN");
    await reference.update({
      content: parsed.data.content,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND")
      return Response.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const { postId, commentId } = await params;
    const db = getAdminDb();
    const postRef = db.collection("posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);
    await db.runTransaction(async (transaction) => {
      const comment = await transaction.get(commentRef);
      if (!comment.exists || comment.data()?.status !== "published")
        throw new Error("COMMENT_NOT_FOUND");
      if (comment.data()?.authorId !== user.uid) throw new Error("FORBIDDEN");
      transaction.update(commentRef, {
        status: "deleted",
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, {
        commentCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND")
      return Response.json({ error: "댓글을 찾을 수 없어요." }, { status: 404 });
    return apiError(error);
  }
}
