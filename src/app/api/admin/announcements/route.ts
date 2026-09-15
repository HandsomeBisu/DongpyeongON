import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError } from "@/lib/api-auth";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { getAdminDb } from "@/lib/firebase/admin";
import { notifyAllUsers, safelyNotify } from "@/lib/notifications";

const announcementSchema = z.object({
  title: z.string().trim().min(2).max(80),
  content: z.string().trim().min(2).max(3000),
  showPopup: z.boolean(),
  showBanner: z.boolean(),
});

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const snapshot = await getAdminDb()
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();
    return Response.json({
      announcements: snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          title: data.title,
          content: data.content,
          showPopup: data.showPopup === true,
          showBanner: data.showBanner === true,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : null,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "community");
    const parsed = announcementSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json(
        { error: "공지 제목과 내용을 확인해 주세요." },
        { status: 400 },
      );

    const db = getAdminDb();
    const recent = await db.collection("announcements").limit(100).get();
    const batch = db.batch();
    for (const document of recent.docs) {
      const data = document.data();
      const update: Record<string, boolean> = {};
      if (parsed.data.showPopup && data.showPopup === true)
        update.showPopup = false;
      if (parsed.data.showBanner && data.showBanner === true)
        update.showBanner = false;
      if (Object.keys(update).length) batch.update(document.ref, update);
    }
    const ref = db.collection("announcements").doc();
    batch.set(ref, {
      ...parsed.data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    await safelyNotify(() =>
      notifyAllUsers({
        type: "site_announcement",
        title: "새로운 전체 공지가 등록됐어요.",
        body: parsed.data.title,
        href: `/announcement/${ref.id}`,
      }),
    );
    return Response.json({ id: ref.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
