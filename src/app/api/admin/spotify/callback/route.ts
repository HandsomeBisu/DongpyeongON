import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeSpotifyCode, matchesSpotifyOAuthState, SPOTIFY_OAUTH_STATE_COOKIE, spotifyRefreshCookie, spotifyStateCookie } from "@/lib/spotify-user-auth";

function adminRedirect(request: Request, result: string) {
  return new URL(`/admin/music?spotify=${result}`, request.url);
}

function redirectResult(request: Request, result: string) {
  const response = NextResponse.redirect(adminRedirect(request, result));
  response.cookies.set(spotifyStateCookie("", 0));
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const receivedState = url.searchParams.get("state");
  const expectedState = (await cookies()).get(SPOTIFY_OAUTH_STATE_COOKIE)?.value;

  if (!receivedState || !expectedState || !matchesSpotifyOAuthState(expectedState, receivedState)) return redirectResult(request, "invalid-state");
  if (url.searchParams.has("error")) return redirectResult(request, "denied");
  if (!code) return redirectResult(request, "failed");

  try {
    const token = await exchangeSpotifyCode(code);
    if (!token.refreshToken) return redirectResult(request, "no-refresh-token");
    const response = NextResponse.redirect(adminRedirect(request, "connected"));
    response.cookies.set(spotifyStateCookie("", 0));
    response.cookies.set(spotifyRefreshCookie(token.refreshToken));
    return response;
  } catch {
    return redirectResult(request, "failed");
  }
}
