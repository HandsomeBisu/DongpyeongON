import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const schema = z.object({ verified: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const input = schema.safeParse(await request.json().catch(() => null));
    if (!input.success)
      return Response.json(
        { error: "인증 마크 설정을 확인해 주세요." },
        { status: 400 },
      );

    const { uid } = await params;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const verifiedRef = db.collection("verifiedUsers").doc(uid);
    await db.runTransaction(async (transaction) => {
      const user = await transaction.get(userRef);
      if (!user.exists) throw new Error("NOT_FOUND");
      transaction.update(userRef, {
        verified: input.data.verified,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (input.data.verified) {
        transaction.set(verifiedRef, {
          userId: uid,
          grantedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.delete(verifiedRef);
      }
    });

    return Response.json({ ok: true, verified: input.data.verified });
  } catch (error) {
    return apiError(error);
  }
}
