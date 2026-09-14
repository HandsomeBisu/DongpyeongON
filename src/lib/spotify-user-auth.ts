import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { spotifyCredentials } from "@/lib/spotify";

export const SPOTIFY_OAUTH_STATE_COOKIE = "dpon_spotify_oauth_state";
export const SPOTIFY_REFRESH_COOKIE = "dpon_spotify_refresh";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const scopes = ["streaming", "user-read-email", "user-read-private", "user-modify-playback-state", "user-read-playback-state"];

type SpotifyTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
};

function encryptionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_NOT_CONFIGURED");
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function decrypt(value: string) {
  try {
    const payload = Buffer.from(value, "base64url");
    if (payload.length < 29) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), payload.subarray(0, 12));
    decipher.setAuthTag(payload.subarray(12, 28));
    return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("SPOTIFY_NOT_CONNECTED");
  }
}

function tokenAuthorization() {
  const { clientId, clientSecret } = spotifyCredentials();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function requestToken(body: URLSearchParams) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: tokenAuthorization(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as SpotifyTokenResponse;
  if (!response.ok || !data.access_token) throw new Error("SPOTIFY_AUTH_FAILED");
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 3600, refreshToken: data.refresh_token };
}

export function spotifyRedirectUri() {
  const value = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (!value) throw new Error("SPOTIFY_REDIRECT_NOT_CONFIGURED");
  return value;
}

export function spotifyAuthorizeUrl(state: string) {
  const { clientId } = spotifyCredentials();
  const params = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: spotifyRedirectUri(), state, scope: scopes.join(" "), show_dialog: "true" });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export function createSpotifyOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function matchesSpotifyOAuthState(expected: string, received: string) {
  const expectedHash = createHash("sha256").update(expected).digest();
  const receivedHash = createHash("sha256").update(received).digest();
  return timingSafeEqual(expectedHash, receivedHash);
}

export async function exchangeSpotifyCode(code: string) {
  return requestToken(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: spotifyRedirectUri() }));
}

export async function refreshSpotifyAccessToken(refreshToken: string) {
  return requestToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
}

export async function getSpotifyRefreshToken() {
  const value = (await cookies()).get(SPOTIFY_REFRESH_COOKIE)?.value;
  if (!value) throw new Error("SPOTIFY_NOT_CONNECTED");
  return decrypt(value);
}

export function spotifyStateCookie(value: string, maxAge = 10 * 60) {
  return { name: SPOTIFY_OAUTH_STATE_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

export function spotifyRefreshCookie(refreshToken: string, maxAge = 180 * 24 * 60 * 60) {
  return { name: SPOTIFY_REFRESH_COOKIE, value: refreshToken ? encrypt(refreshToken) : "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge };
}
