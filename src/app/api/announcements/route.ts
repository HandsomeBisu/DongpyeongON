import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getAdminDb();
    const now = Timestamp.now();
    const [announcementSnapshot, popupSnapshot] = await Promise.all([
      db
        .collection("announcements")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get(),
      db.collection("postPopups").where("expiresAt", ">", now).limit(20).get(),
    ]);
    const siteAnnouncements = announcementSnapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          title: typeof data.title === "string" ? data.title : "",
          content: typeof data.content === "string" ? data.content : "",
          showPopup: data.showPopup === true,
          showBanner: data.showBanner === true,
          kind: "site" as const,
          href: `/announcement/${document.id}`,
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
    const postPopups = (
      await Promise.all(
        popupSnapshot.docs.map(async (popupDocument) => {
          const popup = popupDocument.data();
          const postId =
            typeof popup.postId === "string" ? popup.postId : popupDocument.id;
          const postDocument = await db.collection("posts").doc(postId).get();
          const post = postDocument.data();
          if (
            !postDocument.exists ||
            post?.status !== "published" ||
            post.category !== "학생회 공지" ||
            typeof post.title !== "string" ||
            typeof post.content !== "string"
          )
            return null;
          return {
            id: `post-${postId}`,
            title: post.title,
            content: post.content,
            showPopup: true,
            showBanner: false,
            kind: "student_council" as const,
            href: `/post/${postId}`,
            createdAt:
              popup.createdAt instanceof Timestamp
                ? popup.createdAt.toDate().toISOString()
                : null,
            expiresAt:
              popup.expiresAt instanceof Timestamp
                ? popup.expiresAt.toDate().toISOString()
                : null,
          };
        }),
      )
    ).filter((item) => item !== null);
    const announcements = [...siteAnnouncements, ...postPopups]
      .sort(
        (left, right) =>
          new Date(right.createdAt ?? 0).getTime() -
          new Date(left.createdAt ?? 0).getTime(),
      )
      .slice(0, 20);
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
