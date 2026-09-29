import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { searchYouTubeVideos, YouTubeApiError } from "@/lib/youtube";

const requestIdSchema = z.string().trim().min(1).max(200);

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const parsed = requestIdSchema.safeParse(new URL(request.url).searchParams.get("requestId"));
    if (!parsed.success) return Response.json({ error: "신청곡을 확인해 주세요." }, { status: 400 });
    const snapshot = await getAdminDb().collection("songRequests").doc(parsed.data).get();
    if (!snapshot.exists) return Response.json({ error: "신청곡을 찾을 수 없어요." }, { status: 404 });
    const song = snapshot.data();
    return Response.json({ candidates: await searchYouTubeVideos(String(song?.name ?? ""), String(song?.artists ?? "")) });
  } catch (error) {
    if (error instanceof Error && error.message === "YOUTUBE_NOT_CONFIGURED")
      return Response.json({ error: "YouTube API 키를 설정해 주세요." }, { status: 503 });
    if (error instanceof YouTubeApiError)
      return Response.json({ error: error.status === 403 ? "YouTube API 권한 또는 할당량을 확인해 주세요." : "영상 검색을 사용할 수 없어요." }, { status: 502 });
    return apiError(error);
  }
}
