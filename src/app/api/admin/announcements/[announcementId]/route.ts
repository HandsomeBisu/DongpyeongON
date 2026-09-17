import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const announcementSchema = z.object({
  title: z.string().trim().min(2).max(80),
  content: z.string().trim().min(2).max(3000),
  showPopup: z.boolean(),
  showBanner: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const { announcementId } = await params;
    if (!/^[A-Za-z0-9]{20}$/.test(announcementId))
      throw new Error("NOT_FOUND");
    const parsed = announcementSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json(
        { error: "공지 제목과 내용을 확인해 주세요." },
        { status: 400 },
      );

    const reference = getAdminDb()
      .collection("announcements")
      .doc(announcementId);
    if (!(await reference.get()).exists) throw new Error("NOT_FOUND");
    await reference.update({
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
