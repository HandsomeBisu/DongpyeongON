import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { isSchoolEmail, normalizeEmail } from "@/lib/firebase/school-email";

export const runtime = "nodejs";

const confirmationSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail).refine(isSchoolEmail),
  code: z.string().trim().regex(/^\d{6}$/),
});

type VerificationOutcome = "valid" | "invalid" | "expired" | "locked";

function hashesMatch(expected: string, supplied: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function confirmationError(outcome: Exclude<VerificationOutcome, "valid">) {
  if (outcome === "expired") return Response.json({ error: "인증 코드가 만료되었습니다. 로그인 화면에서 새 코드를 받아 주세요." }, { status: 410 });
  if (outcome === "locked") return Response.json({ error: "입력 가능 횟수를 초과했습니다. 로그인 화면에서 새 코드를 받아 주세요." }, { status: 429 });
  return Response.json({ error: "이메일 또는 인증 코드가 올바르지 않습니다." }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const parsed = confirmationSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "학교 이메일과 6자리 인증 코드를 확인해 주세요." }, { status: 400 });

    const [{ Timestamp }, { getAdminAuth, getAdminDb }, { hashVerificationCode, VERIFICATION_MAX_ATTEMPTS }] = await Promise.all([
      import("firebase-admin/firestore"),
      import("@/lib/firebase/admin"),
      import("@/lib/email-verification"),
    ]);
    const adminAuth = getAdminAuth();
    const db = getAdminDb();
    const user = await adminAuth.getUserByEmail(parsed.data.email).catch(() => null);
    if (!user || !isSchoolEmail(user.email ?? "")) return confirmationError("invalid");

    const challengeRef = db.collection("emailVerificationChallenges").doc(user.uid);
    if (user.emailVerified) {
      await challengeRef.delete().catch(() => undefined);
      return Response.json({ verified: true });
    }

    const suppliedHash = hashVerificationCode(user.uid, parsed.data.code);
    const now = Date.now();
    const outcome = await db.runTransaction<VerificationOutcome>(async (transaction) => {
      const challenge = await transaction.get(challengeRef);
      if (!challenge.exists) return "invalid";
      const data = challenge.data()!;
      if (data.email !== parsed.data.email) return "invalid";
      if (!(data.expiresAt instanceof Timestamp) || data.expiresAt.toMillis() <= now) {
        transaction.delete(challengeRef);
        return "expired";
      }

      const attempts = Number.isInteger(data.attempts) ? data.attempts : 0;
      if (attempts >= VERIFICATION_MAX_ATTEMPTS) {
        transaction.delete(challengeRef);
        return "locked";
      }
      if (typeof data.codeHash !== "string" || !hashesMatch(data.codeHash, suppliedHash)) {
        const nextAttempts = attempts + 1;
        if (nextAttempts >= VERIFICATION_MAX_ATTEMPTS) transaction.delete(challengeRef);
        else transaction.update(challengeRef, { attempts: nextAttempts });
        return nextAttempts >= VERIFICATION_MAX_ATTEMPTS ? "locked" : "invalid";
      }
      return "valid";
    });

    if (outcome !== "valid") return confirmationError(outcome);

    await adminAuth.updateUser(user.uid, { emailVerified: true });
    await challengeRef.delete();
    return Response.json({ verified: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMAIL_VERIFICATION_NOT_CONFIGURED") {
      return Response.json({ error: "이메일 인증 설정이 완료되지 않았습니다." }, { status: 503 });
    }
    if (message === "FIREBASE_ADMIN_NOT_CONFIGURED" || message === "FIREBASE_ADMIN_INVALID_CONFIG") {
      return Response.json({ error: "Firebase Admin 환경 변수 설정을 확인해 주세요." }, { status: 503 });
    }
    console.error("Failed to confirm an email verification code", error);
    return Response.json({ error: "인증 코드를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
