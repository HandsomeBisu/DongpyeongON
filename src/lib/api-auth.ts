import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isSchoolEmail } from "@/lib/firebase/school-email";
import {
  isAccountSuspended,
  parseAccountSuspension,
} from "@/lib/account-suspension";

export async function verifyApiRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const decoded = await getAdminAuth().verifyIdToken(header.slice(7));
  if (
    !decoded.email ||
    !isSchoolEmail(decoded.email) ||
    decoded.email_verified !== true
  )
    throw new Error("FORBIDDEN");
  return decoded;
}

export async function verifyOnboardedApiRequest(request: Request) {
  const user = await verifyApiRequest(request);
  const profile = await getAdminDb().collection("users").doc(user.uid).get();
  if (!profile.exists || profile.data()?.onboardingCompleted !== true)
    throw new Error("FORBIDDEN");
  if (isAccountSuspended(parseAccountSuspension(profile.data()?.suspension)))
    throw new Error("ACCOUNT_SUSPENDED");
  return { user, profile: profile.data() ?? {} };
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED")
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (message === "FORBIDDEN")
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  if (message === "ACCOUNT_SUSPENDED")
    return Response.json(
      { error: "계정 이용이 일시적으로 제한되었습니다.", code: message },
      { status: 403 },
    );
  if (message === "NOT_FOUND")
    return Response.json(
      { error: "게시물을 찾을 수 없습니다." },
      { status: 404 },
    );
  if (
    message === "FIREBASE_ADMIN_NOT_CONFIGURED" ||
    message === "FIREBASE_ADMIN_INVALID_CONFIG"
  )
    return Response.json(
      { error: "Firebase Admin 환경 변수 설정을 확인해 주세요." },
      { status: 503 },
    );
  if (message === "ADMIN_LOCKED")
    return Response.json(
      { error: "관리자 비밀번호 인증이 필요합니다." },
      { status: 423 },
    );
  if (message === "ADMIN_PASSWORD_NOT_CONFIGURED")
    return Response.json(
      { error: "선택한 관리 영역의 비밀번호 환경 변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  if (message === "ADMIN_SESSION_SECRET_NOT_CONFIGURED")
    return Response.json(
      { error: "ADMIN_SESSION_SECRET을 32자 이상으로 설정해 주세요." },
      { status: 503 },
    );
  if (message === "SPOTIFY_REDIRECT_NOT_CONFIGURED")
    return Response.json(
      { error: "Spotify Redirect URI 환경 변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  if (message === "SPOTIFY_NOT_CONFIGURED")
    return Response.json(
      { error: "Spotify 환경 변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  if (message === "NEIS_REQUEST_FAILED" || message === "NEIS_INVALID_RESPONSE")
    return Response.json(
      { error: "나이스 교육정보를 불러오지 못했어요." },
      { status: 502 },
    );
  return Response.json(
    { error: "요청을 처리하지 못했습니다." },
    { status: 500 },
  );
}
