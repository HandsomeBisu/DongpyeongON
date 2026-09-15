import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const { announcementId } = await params;
    if (!/^[A-Za-z0-9]{20}$/.test(announcementId))
      return Response.json(
        { error: "공지사항을 찾을 수 없어요." },
        { status: 404 },
      );

    const snapshot = await getAdminDb()
      .collection("announcements")
      .doc(announcementId)
      .get();
    const data = snapshot.data();
    if (
      !snapshot.exists ||
      !data ||
      (data.showPopup !== true && data.showBanner !== true)
    )
      return Response.json(
        { error: "공지사항을 찾을 수 없어요." },
        { status: 404 },
      );

    return Response.json(
      {
        announcement: {
          id: snapshot.id,
          title: typeof data.title === "string" ? data.title : "",
          content: typeof data.content === "string" ? data.content : "",
          showPopup: data.showPopup === true,
          showBanner: data.showBanner === true,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "공지사항을 불러오지 못했어요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
