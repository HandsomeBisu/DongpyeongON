import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { searchSpotifyTracks, SpotifyApiError } from "@/lib/spotify";

const querySchema = z.string().trim().min(2).max(100);

export async function GET(request: Request) {
  try {
    await verifyOnboardedApiRequest(request);
    const query = querySchema.safeParse(new URL(request.url).searchParams.get("q"));
    if (!query.success) return Response.json({ error: "검색어를 2자 이상 입력해 주세요." }, { status: 400 });
    return Response.json({ tracks: await searchSpotifyTracks(query.data) });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return Response.json({ error: error.status === 429 ? "검색 요청이 많아요. 잠시 후 다시 시도해 주세요." : "Spotify 검색을 사용할 수 없어요.", retryAfter: error.retryAfter }, { status: error.status === 429 ? 429 : 502 });
    }
    if (error instanceof Error && error.message === "SPOTIFY_NOT_CONFIGURED") return Response.json({ error: "Spotify 환경 변수가 설정되지 않았습니다." }, { status: 503 });
    return apiError(error);
  }
}
