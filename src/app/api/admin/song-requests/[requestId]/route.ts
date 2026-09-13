import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const schema = z.object({ status: z.enum(["pending", "approved", "rejected", "played"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "처리 상태를 확인해 주세요." }, { status: 400 });
    const { requestId } = await params;
    const reference = getAdminDb().collection("songRequests").doc(requestId);
    if (!(await reference.get()).exists) return Response.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    await reference.update({ status: parsed.data.status, updatedAt: FieldValue.serverTimestamp() });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
