import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyApiRequest } from "@/lib/api-auth";
import { isAccountSuspended, isInvalidNameSuspension, parseAccountSuspension } from "@/lib/account-suspension";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { studentProfileSchema } from "@/lib/user-profile";

const schema = z.object({ name: studentProfileSchema.shape.name });

export async function POST(request: Request) {
  try {
    const user = await verifyApiRequest(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json({ error: parsed.error.issues[0]?.message ?? "이름을 확인해 주세요." }, { status: 400 });

    const reference = getAdminDb().collection("users").doc(user.uid);
    await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const suspension = parseAccountSuspension(snapshot.data()?.suspension);
      if (!isAccountSuspended(suspension) || !isInvalidNameSuspension(suspension)) throw new Error("FORBIDDEN");
      if (snapshot.data()?.name === parsed.data.name)
        throw new Error("SAME_NAME");
      transaction.update(reference, {
        name: parsed.data.name,
        displayName: parsed.data.name,
        suspension: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await getAdminAuth().updateUser(user.uid, { displayName: parsed.data.name });
    } catch (error) {
      console.error("Firebase Auth display name update failed", error);
    }
    return Response.json({ ok: true, name: parsed.data.name });
  } catch (error) {
    if (error instanceof Error && error.message === "SAME_NAME")
      return Response.json({ error: "현재 이름과 다른 올바른 이름을 입력해 주세요." }, { status: 400 });
    return apiError(error);
  }
}
