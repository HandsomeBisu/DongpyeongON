import { NextResponse } from "next/server";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { createSpotifyOAuthState, spotifyAuthorizeUrl, spotifyStateCookie } from "@/lib/spotify-user-auth";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const state = createSpotifyOAuthState();
    const response = NextResponse.redirect(spotifyAuthorizeUrl(state));
    response.cookies.set(spotifyStateCookie(state));
    return response;
  } catch (error) {
    return apiError(error);
  }
}
