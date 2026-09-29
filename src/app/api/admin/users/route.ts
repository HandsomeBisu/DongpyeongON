import { FieldPath } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeUserRole } from "@/types/domain";
import { parseAccountSuspension } from "@/lib/account-suspension";

const PAGE_SIZE = 10;
const pageSchema = z.coerce.number().int().min(1).max(10_000);

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const parsed = pageSchema.safeParse(new URL(request.url).searchParams.get("page") ?? "1");
    if (!parsed.success) return Response.json({ error: "페이지 번호가 올바르지 않습니다." }, { status: 400 });
    const collection = getAdminDb().collection("users");
    const [snapshot, countSnapshot] = await Promise.all([
      collection.orderBy(FieldPath.documentId()).offset((parsed.data - 1) * PAGE_SIZE).limit(PAGE_SIZE).get(),
      collection.count().get(),
    ]);
    return Response.json({
      page: parsed.data,
      pageSize: PAGE_SIZE,
      total: countSnapshot.data().count,
      users: snapshot.docs.map((doc) => {
        const data = doc.data();
        const suspension = parseAccountSuspension(data.suspension);
        return {
          uid: doc.id,
          displayName: data.displayName,
          email: data.email,
          role: normalizeUserRole(data.role),
          verified: data.verified === true,
          suspension:
            suspension && suspension.endsAt > Date.now() ? suspension : null,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
