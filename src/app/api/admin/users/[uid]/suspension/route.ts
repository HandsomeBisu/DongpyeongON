import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    reason: z.string().trim().min(2).max(500),
    endsAt: z.string().datetime({ offset: true }),
  }),
  z.object({ action: z.literal("release") }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "정지 사유와 종료 시간을 확인해 주세요." },
        { status: 400 },
      );

    const { uid } = await params;
    const reference = getAdminDb().collection("users").doc(uid);
    const snapshot = await reference.get();
    if (!snapshot.exists) throw new Error("NOT_FOUND");

    if (parsed.data.action === "release") {
      await reference.update({
        suspension: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return Response.json({ ok: true, suspension: null });
    }

    const endsAt = new Date(parsed.data.endsAt);
    const now = new Date();
    if (endsAt.getTime() <= now.getTime())
      return Response.json(
        { error: "정지 종료 시간은 현재보다 이후여야 합니다." },
        { status: 400 },
      );

    const suspension = {
      reason: parsed.data.reason,
      startsAt: Timestamp.fromDate(now),
      endsAt: Timestamp.fromDate(endsAt),
    };
    await reference.update({
      suspension,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({
      ok: true,
      suspension: {
        reason: suspension.reason,
        startsAt: now.getTime(),
        endsAt: endsAt.getTime(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
