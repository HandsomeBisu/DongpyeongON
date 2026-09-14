import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getSpotifyRefreshToken, refreshSpotifyAccessToken, spotifyRefreshCookie } from "@/lib/spotify-user-auth";

const schema = z.object({ deviceId: z.string().min(1).max(200), uris: z.array(z.string().regex(/^spotify:track:[A-Za-z0-9]+$/)).min(1).max(100) });

export async function PUT(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "재생할 기기와 곡 목록을 확인해 주세요." }, { status: 400 });
    const currentRefreshToken = await getSpotifyRefreshToken();
    const token = await refreshSpotifyAccessToken(currentRefreshToken);
    const spotifyResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(parsed.data.deviceId)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: parsed.data.uris }),
      cache: "no-store",
    });
    if (!spotifyResponse.ok) {
      const error = spotifyResponse.status === 403 ? "Spotify Premium 계정과 재생 권한을 확인해 주세요." : spotifyResponse.status === 404 ? "Spotify 플레이어가 아직 준비되지 않았어요." : "Spotify에서 재생을 시작하지 못했어요.";
      return Response.json({ error }, { status: spotifyResponse.status });
    }
    const response = NextResponse.json({ playing: true });
    if (token.refreshToken) response.cookies.set(spotifyRefreshCookie(token.refreshToken));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SPOTIFY_NOT_CONNECTED" || message === "SPOTIFY_AUTH_FAILED") return Response.json({ error: "Spotify Premium 계정을 다시 연결해 주세요." }, { status: 401 });
    return apiError(error);
  }
}
