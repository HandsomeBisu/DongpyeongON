import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const NOTIFICATION_TYPES = [
  "student_council_announcement",
  "site_announcement",
  "post_comment",
  "post_like",
  "report_received",
  "report_resolved",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

type NotificationInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  actorId?: string;
};

export async function createNotification(input: NotificationInput) {
  if (input.actorId && input.actorId === input.recipientId) return;
  await getAdminDb().collection("notifications").add({
    ...input,
    body: input.body ?? "",
    href: input.href ?? "",
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function notifyAllUsers(
  input: Omit<NotificationInput, "recipientId">,
) {
  const db = getAdminDb();
  const users = await db
    .collection("users")
    .where("onboardingCompleted", "==", true)
    .get();
  const recipients = users.docs.filter((user) => user.id !== input.actorId);

  for (let offset = 0; offset < recipients.length; offset += 450) {
    const batch = db.batch();
    for (const user of recipients.slice(offset, offset + 450)) {
      batch.set(db.collection("notifications").doc(), {
        ...input,
        recipientId: user.id,
        body: input.body ?? "",
        href: input.href ?? "",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

export async function safelyNotify(operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}
