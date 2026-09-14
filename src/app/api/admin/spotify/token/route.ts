import { NextResponse } from "next/server";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getSpotifyRefreshToken, refreshSpotifyAccessToken, spotifyRefreshCookie } from "@/lib/spotify-user-auth";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const currentRefreshToken = await getSpotifyRefreshToken();
    const token = await refreshSpotifyAccessToken(currentRefreshToken);
    const response = NextResponse.json({ accessToken: token.accessToken, expiresIn: token.expiresIn }, { headers: { "Cache-Control": "no-store" } });
    if (token.refreshToken) response.cookies.set(spotifyRefreshCookie(token.refreshToken));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SPOTIFY_NOT_CONNECTED" || message === "SPOTIFY_AUTH_FAILED") {
      const response = NextResponse.json({ error: "Spotify Premium 계정을 연결해 주세요." }, { status: 401, headers: { "Cache-Control": "no-store" } });
      response.cookies.set(spotifyRefreshCookie("", 0));
      return response;
    }
    if (message === "SPOTIFY_REDIRECT_NOT_CONFIGURED") return Response.json({ error: "Spotify Redirect URI 환경 변수가 설정되지 않았습니다." }, { status: 503 });
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const response = NextResponse.json({ connected: false });
    response.cookies.set(spotifyRefreshCookie("", 0));
    return response;
  } catch (error) {
    return apiError(error);
  }
}
