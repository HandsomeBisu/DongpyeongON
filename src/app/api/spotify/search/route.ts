import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { searchSpotifyTracks, SpotifyApiError } from "@/lib/spotify";

const querySchema = z.string().trim().min(2).max(100);
const offsetSchema = z.coerce.number().int().min(0).max(1_000);

export async function GET(request: Request) {
  try {
    await verifyOnboardedApiRequest(request);
    const searchParams = new URL(request.url).searchParams;
    const query = querySchema.safeParse(searchParams.get("q"));
    if (!query.success)
      return Response.json(
        { error: "검색어를 2자 이상 입력해 주세요." },
        { status: 400 },
      );
    const offset = offsetSchema.safeParse(searchParams.get("offset") ?? "0");
    if (!offset.success)
      return Response.json(
        { error: "검색 위치가 올바르지 않습니다." },
        { status: 400 },
      );
    return Response.json(await searchSpotifyTracks(query.data, offset.data));
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      console.error("Spotify search request failed", {
        status: error.status,
        operation: error.operation,
        code: error.code,
      });
      if (error.status === 429)
        return Response.json(
          {
            error: "검색 요청이 많아요. 잠시 후 다시 시도해 주세요.",
            retryAfter: error.retryAfter,
          },
          { status: 429 },
        );
      if (error.operation === "token" && [400, 401].includes(error.status))
        return Response.json(
          {
            error: "Spotify Client ID 또는 Client Secret을 확인해 주세요.",
          },
          { status: 503 },
        );
      if (error.status === 403)
        return Response.json(
          {
            error:
              "Spotify 앱 권한과 앱 소유자의 Premium 상태를 확인해 주세요.",
          },
          { status: 503 },
        );
      return Response.json(
        { error: "Spotify 검색을 사용할 수 없어요." },
        { status: 502 },
      );
    }
    if (error instanceof Error && error.message === "SPOTIFY_NOT_CONFIGURED")
      return Response.json(
        { error: "Spotify 환경 변수가 설정되지 않았습니다." },
        { status: 503 },
      );
    return apiError(error);
  }
}
