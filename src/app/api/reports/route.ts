import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const schema = z.object({ postId: z.string().min(1), reason: z.enum(["욕설·비방", "개인정보 노출", "광고·도배", "부적절한 내용", "기타"]), detail: z.string().trim().max(500).optional() });
export async function POST(request: Request) { try { const user = await verifyApiRequest(request); const input = schema.parse(await request.json()); const id = `${input.postId}_${user.uid}`; await getAdminDb().collection("reports").doc(id).set({ ...input, reporterId: user.uid, status: "pending", createdAt: FieldValue.serverTimestamp() }); return Response.json({ ok: true }, { status: 201 }); } catch (error) { return apiError(error); } }
