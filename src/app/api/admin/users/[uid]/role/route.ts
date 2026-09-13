import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

const schema = z.object({ role: z.enum(["student", "teacher", "admin"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const { role } = schema.parse(await request.json()); const { uid } = await params; const target = await getAdminAuth().getUser(uid);
    await getAdminAuth().setCustomUserClaims(uid, { ...target.customClaims, role });
    await getAdminDb().collection("users").doc(uid).update({ role });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
