import { Timestamp } from "firebase-admin/firestore";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const snapshot = await getAdminDb()
      .collection("notifications")
      .where("recipientId", "==", user.uid)
      .limit(100)
      .get();
    const notifications = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          type: data.type,
          title: data.title,
          body: data.body ?? "",
          href: data.href ?? "",
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : null,
        };
      })
      .sort((left, right) =>
        (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
      );
    return Response.json({ notifications });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const db = getAdminDb();
    const snapshot = await db
      .collection("notifications")
      .where("recipientId", "==", user.uid)
      .get();
    for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
      const batch = db.batch();
      for (const document of snapshot.docs.slice(offset, offset + 450))
        batch.delete(document.ref);
      await batch.commit();
    }
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
