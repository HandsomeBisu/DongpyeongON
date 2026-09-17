import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";

export async function getVerifiedUserIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Set<string>();
  const db = getAdminDb();
  const snapshots = await db.getAll(
    ...uniqueIds.map((userId) => db.collection("users").doc(userId)),
  );
  return new Set(
    snapshots
      .filter((snapshot) => snapshot.data()?.verified === true)
      .map((snapshot) => snapshot.id),
  );
}
