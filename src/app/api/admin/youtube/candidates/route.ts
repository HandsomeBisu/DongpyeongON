import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { searchYouTubeVideos, YouTubeApiError } from "@/lib/youtube";

const requestIdSchema = z.string().trim().min(1).max(200);
const querySchema = z.string().trim().min(1).max(120);

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const searchParams = new URL(request.url).searchParams;
    const parsed = requestIdSchema.safeParse(searchParams.get("requestId"));
    if (!parsed.success) return Response.json({ error: "신청곡을 확인해 주세요." }, { status: 400 });
    const rawQuery = searchParams.get("query");
    const query = rawQuery === null ? undefined : querySchema.safeParse(rawQuery);
    if (query && !query.success) return Response.json({ error: "검색어를 1~120자로 입력해 주세요." }, { status: 400 });
    const snapshot = await getAdminDb().collection("songRequests").doc(parsed.data).get();
    if (!snapshot.exists) return Response.json({ error: "신청곡을 찾을 수 없어요." }, { status: 404 });
    const song = snapshot.data();
    return Response.json({ candidates: await searchYouTubeVideos(String(song?.name ?? ""), String(song?.artists ?? ""), query?.data) });
  } catch (error) {
    if (error instanceof Error && error.message === "YOUTUBE_NOT_CONFIGURED")
      return Response.json({ error: "YouTube API 키를 설정해 주세요." }, { status: 424 });
    if (error instanceof YouTubeApiError)
      return Response.json({ error: youtubeErrorMessage(error), reason: error.reason }, { status: 424 });
    return apiError(error);
  }
}

function youtubeErrorMessage(error: YouTubeApiError) {
  if (/quota|limitExceeded/i.test(error.reason)) return "YouTube API 검색 할당량이 소진됐어요. Google Cloud 할당량을 확인해 주세요.";
  if (/accessNotConfigured|SERVICE_DISABLED/i.test(error.reason)) return "Google Cloud 프로젝트에서 YouTube Data API v3를 사용 설정해 주세요.";
  if (/API_KEY_INVALID|keyInvalid/i.test(error.reason)) return "배포 환경의 YOUTUBE_API_KEY 값이 올바른지 확인해 주세요.";
  if (/API_KEY_HTTP_REFERRER_BLOCKED/i.test(error.reason)) return "서버에서 사용하는 API 키에 웹사이트 리퍼러 제한이 설정되어 있어요.";
  if (/API_KEY_IP_ADDRESS_BLOCKED/i.test(error.reason)) return "API 키의 IP 주소 제한에 배포 서버가 포함되지 않았어요.";
  if (/API_KEY_SERVICE_BLOCKED/i.test(error.reason)) return "API 키의 API 제한에 YouTube Data API v3를 추가해 주세요.";
  return `YouTube API 요청이 실패했어요. Google 응답 코드: ${error.status}, 사유: ${error.reason}`;
}
