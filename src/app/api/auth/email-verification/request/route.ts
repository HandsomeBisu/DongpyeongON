import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isSchoolEmail, normalizeEmail } from "@/lib/firebase/school-email";
import {
  createVerificationCode,
  hashVerificationCode,
  hashVerificationIdentifier,
  sendVerificationCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_IP_MAX_REQUESTS,
  VERIFICATION_IP_WINDOW_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "@/lib/email-verification";

export const runtime = "nodejs";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  return header.slice(7);
}

async function pendingUser(request: Request) {
  try {
    return await getAdminAuth().verifyIdToken(bearerToken(request));
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

function timestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function requestIp(request: Request) {
  const forwarded = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for"))?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "학교 이메일 계정만 인증할 수 있습니다." }, { status: 403 });
  if (message === "ALREADY_VERIFIED") return Response.json({ error: "이미 인증된 이메일입니다." }, { status: 409 });
  if (message === "RATE_LIMITED") return Response.json({ error: "인증 코드는 60초 후 다시 요청할 수 있습니다." }, { status: 429 });
  if (message === "IP_RATE_LIMITED") return Response.json({ error: "현재 인증 요청이 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  if (message === "EMAIL_VERIFICATION_NOT_CONFIGURED") return Response.json({ error: "이메일 발송 설정이 완료되지 않았습니다." }, { status: 503 });
  console.error("Failed to send an email verification code", error);
  return Response.json({ error: "인증 코드를 보내지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
}

export async function POST(request: Request) {
  try {
    const decoded = await pendingUser(request);
    const email = normalizeEmail(decoded.email ?? "");
    if (!isSchoolEmail(email)) throw new Error("FORBIDDEN");
    if (decoded.email_verified === true) throw new Error("ALREADY_VERIFIED");

    const code = createVerificationCode();
    const codeHash = hashVerificationCode(decoded.uid, code);
    const now = Date.now();
    const reservationId = randomUUID();
    const ref = getAdminDb().collection("emailVerificationChallenges").doc(decoded.uid);
    const ipLimitRef = getAdminDb().collection("emailVerificationIpLimits").doc(hashVerificationIdentifier(requestIp(request)));

    await getAdminDb().runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      const ipLimit = await transaction.get(ipLimitRef);
      if (current.exists && timestampMillis(current.data()?.nextSendAt) > now) {
        throw new Error("RATE_LIMITED");
      }

      const currentWindowStartedAt = timestampMillis(ipLimit.data()?.windowStartedAt);
      const withinCurrentWindow = ipLimit.exists && currentWindowStartedAt > now - VERIFICATION_IP_WINDOW_MS;
      const currentCount = withinCurrentWindow && Number.isInteger(ipLimit.data()?.count) ? ipLimit.data()!.count : 0;
      if (currentCount >= VERIFICATION_IP_MAX_REQUESTS) throw new Error("IP_RATE_LIMITED");

      transaction.set(ref, {
        uid: decoded.uid,
        email,
        codeHash,
        attempts: 0,
        reservationId,
        createdAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + VERIFICATION_CODE_TTL_MS),
        nextSendAt: Timestamp.fromMillis(now + VERIFICATION_RESEND_COOLDOWN_MS),
      });
      transaction.set(ipLimitRef, {
        count: currentCount + 1,
        windowStartedAt: Timestamp.fromMillis(withinCurrentWindow ? currentWindowStartedAt : now),
        expiresAt: Timestamp.fromMillis(now + VERIFICATION_IP_WINDOW_MS),
      });
    });

    try {
      await sendVerificationCode(email, code);
    } catch (error) {
      await getAdminDb().runTransaction(async (transaction) => {
        const current = await transaction.get(ref);
        if (current.data()?.reservationId === reservationId) transaction.delete(ref);
      });
      throw error;
    }

    return Response.json({ sent: true, expiresInSeconds: VERIFICATION_CODE_TTL_MS / 1000 });
  } catch (error) {
    return errorResponse(error);
  }
}
