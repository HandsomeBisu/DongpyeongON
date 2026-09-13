import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyApiRequest } from "@/lib/api-auth";

export const ADMIN_CATEGORIES = ["users", "music", "community"] as const;
export type AdminCategory = (typeof ADMIN_CATEGORIES)[number];

const passwordVariables: Record<AdminCategory, string> = {
  users: "ADMIN_USERS_PASSWORD",
  music: "ADMIN_MUSIC_PASSWORD",
  community: "ADMIN_COMMUNITY_PASSWORD",
};

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_NOT_CONFIGURED");
  return secret;
}

function cookieName(category: AdminCategory) {
  return `dpon_admin_${category}`;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = createHash("sha256").update(left).digest();
  const rightBuffer = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(category: AdminCategory, password: string) {
  const expected = process.env[passwordVariables[category]];
  if (!expected) throw new Error("ADMIN_NOT_CONFIGURED");
  return safeEqual(password, expected);
}

export function createAdminSession(category: AdminCategory, uid: string) {
  const payload = Buffer.from(JSON.stringify({ category, uid, expiresAt: Date.now() + 4 * 60 * 60 * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

async function verifySession(category: AdminCategory, uid: string) {
  const token = (await cookies()).get(cookieName(category))?.value;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { category?: string; uid?: string; expiresAt?: number };
    return parsed.category === category && parsed.uid === uid && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function verifyAdminCategoryRequest(request: Request, category: AdminCategory) {
  const admin = await verifyApiRequest(request);
  if (admin.role !== "admin") throw new Error("FORBIDDEN");
  if (!(await verifySession(category, admin.uid))) throw new Error("ADMIN_LOCKED");
  return admin;
}

export function adminCookie(category: AdminCategory, value: string, maxAge = 4 * 60 * 60) {
  return { name: cookieName(category), value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge };
}
