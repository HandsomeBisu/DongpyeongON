import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getAdminDb()
      .collection("announcements")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const announcements = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          title: typeof data.title === "string" ? data.title : "",
          content: typeof data.content === "string" ? data.content : "",
          showPopup: data.showPopup === true,
          showBanner: data.showBanner === true,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : null,
        };
      })
      .filter(
        (announcement) =>
          announcement.title &&
          (announcement.showPopup || announcement.showBanner),
      );
    return Response.json(
      { announcements },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "공지사항을 불러오지 못했어요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
