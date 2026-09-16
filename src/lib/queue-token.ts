export const QUEUE_ADMISSION_COOKIE = "dpon_queue_admission";
export const QUEUE_VISITOR_COOKIE = "dpon_queue_visitor";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function validVisitorId(value: string) {
  return /^[0-9a-f-]{36}$/iu.test(value);
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signed));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function queueSigningSecret() {
  return process.env.QUEUE_SIGNING_SECRET ?? process.env.ADMIN_SESSION_SECRET;
}

export async function createAdmissionToken(
  visitorId: string,
  expiresAt: number,
  secret: string,
) {
  const payload = `${visitorId}.${expiresAt}`;
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifyAdmissionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
) {
  if (!token) return false;
  const [visitorId, rawExpiresAt, suppliedSignature, ...extra] =
    token.split(".");
  if (
    extra.length ||
    !visitorId ||
    !validVisitorId(visitorId) ||
    !rawExpiresAt ||
    !suppliedSignature
  )
    return false;
  const expiresAt = Number(rawExpiresAt);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = await signature(`${visitorId}.${expiresAt}`, secret);
  return safeEqual(suppliedSignature, expected);
}
