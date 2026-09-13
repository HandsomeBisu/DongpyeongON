import "server-only";

import { createHmac, randomInt } from "node:crypto";

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const VERIFICATION_IP_WINDOW_MS = 10 * 60 * 1000;
export const VERIFICATION_IP_MAX_REQUESTS = 100;

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("EMAIL_VERIFICATION_NOT_CONFIGURED");
  return value;
}

function verificationSecret() {
  const value = requiredEnvironmentVariable("EMAIL_VERIFICATION_SECRET");
  if (value.length < 32) throw new Error("EMAIL_VERIFICATION_NOT_CONFIGURED");
  return value;
}

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(uid: string, code: string) {
  return createHmac("sha256", verificationSecret()).update(`${uid}:${code}`).digest("hex");
}

export function hashVerificationIdentifier(value: string) {
  return createHmac("sha256", verificationSecret()).update(`rate-limit:${value}`).digest("hex");
}

function smtpPort() {
  const port = Number(process.env.SMTP_PORT ?? "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("EMAIL_VERIFICATION_NOT_CONFIGURED");
  }
  return port;
}

function smtpSecure(port: number) {
  const configured = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (!configured) return port === 465;
  if (configured === "true") return true;
  if (configured === "false") return false;
  throw new Error("EMAIL_VERIFICATION_NOT_CONFIGURED");
}

export async function sendVerificationCode(email: string, code: string) {
  const { default: nodemailer } = await import("nodemailer");
  const port = smtpPort();
  const transporter = nodemailer.createTransport({
    host: requiredEnvironmentVariable("SMTP_HOST"),
    port,
    secure: smtpSecure(port),
    auth: {
      user: requiredEnvironmentVariable("SMTP_USER"),
      pass: requiredEnvironmentVariable("SMTP_PASSWORD"),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: requiredEnvironmentVariable("SMTP_FROM"),
    to: email,
    subject: "[동평ON] 이메일 인증 코드",
    text: `동평ON 이메일 인증 코드는 ${code}입니다. 이 코드는 10분 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.`,
    html: `<!doctype html>
<html lang="ko">
  <body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#171719">
    <div style="max-width:520px;margin:0 auto;padding:44px 20px">
      <div style="background:#fff;border:1px solid #e5e5ea;border-radius:24px;padding:38px 32px;text-align:center">
        <p style="margin:0 0 22px;font-size:13px;font-weight:700;letter-spacing:.12em;color:#007aff">DONGPYEONGON</p>
        <h1 style="margin:0;font-size:25px;letter-spacing:-.04em">이메일을 인증해 주세요</h1>
        <p style="margin:14px 0 26px;font-size:14px;line-height:1.7;color:#6e6e73">아래 인증 코드를 동평ON 인증 화면에 입력해 주세요.</p>
        <div style="padding:18px;border-radius:16px;background:#f5f5f7;font-size:34px;font-weight:750;letter-spacing:.2em;color:#171719">${code}</div>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#8e8e93">코드는 10분 동안 유효합니다.<br>본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
      </div>
    </div>
  </body>
</html>`,
  });
}
