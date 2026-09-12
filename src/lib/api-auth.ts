import { getAdminAuth } from "@/lib/firebase/admin";
import { isSchoolEmail } from "@/lib/firebase/school-email";

export async function verifyApiRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const decoded = await getAdminAuth().verifyIdToken(header.slice(7));
  if (!decoded.email || !isSchoolEmail(decoded.email)) throw new Error("FORBIDDEN");
  return decoded;
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  return Response.json({ error: "요청을 처리하지 못했습니다." }, { status: 500 });
}
