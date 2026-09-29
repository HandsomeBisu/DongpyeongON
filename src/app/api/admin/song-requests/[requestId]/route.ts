import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getEmbeddableYouTubeVideo, YouTubeApiError } from "@/lib/youtube";

const schema = z.object({
  status: z.enum(["pending", "approved", "rejected", "played"]),
  youtubeVideoId: z.string().regex(/^[\w-]{11}$/).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    await verifyAdminCategoryRequest(request, "music");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "처리 상태를 확인해 주세요." }, { status: 400 });
    const { requestId } = await params;
    const reference = getAdminDb().collection("songRequests").doc(requestId);
    if (!(await reference.get()).exists) return Response.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    if (parsed.data.status === "approved" && !parsed.data.youtubeVideoId)
      return Response.json({ error: "승인할 YouTube 영상을 선택해 주세요." }, { status: 400 });
    const youtubeVideo = parsed.data.youtubeVideoId
      ? await getEmbeddableYouTubeVideo(parsed.data.youtubeVideoId)
      : null;
    if (parsed.data.youtubeVideoId && !youtubeVideo)
      return Response.json({ error: "재생 가능한 공개 영상이 아니에요. 다른 영상을 골라 주세요." }, { status: 400 });
    const changedAt = FieldValue.serverTimestamp();
    const statusTimestamp = { approved: "approvedAt", rejected: "rejectedAt", played: "playedAt", pending: "reviewedAgainAt" }[parsed.data.status];
    await reference.update({
      status: parsed.data.status,
      updatedAt: changedAt,
      [statusTimestamp]: changedAt,
      ...(youtubeVideo ? { youtubeVideoId: youtubeVideo.videoId, youtubeVideoTitle: youtubeVideo.title } : {}),
    });
    return Response.json({ ok: true, youtubeVideo });
  } catch (error) {
    if (error instanceof Error && error.message === "YOUTUBE_NOT_CONFIGURED")
      return Response.json({ error: "YouTube API 키를 설정해 주세요." }, { status: 503 });
    if (error instanceof YouTubeApiError)
      return Response.json({ error: "YouTube 영상 정보를 확인하지 못했어요." }, { status: 502 });
    return apiError(error);
  }
}
