import "server-only";

export type YouTubeCandidate = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
};

export class YouTubeApiError extends Error {
  constructor(public readonly status: number, public readonly reason: string) {
    super("YOUTUBE_API_ERROR");
  }
}

async function youtubeGet(path: string, params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_NOT_CONFIGURED");
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, { cache: "no-store", headers: { "x-goog-api-key": key } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      error?: { status?: string; errors?: Array<{ reason?: string }>; details?: Array<{ reason?: string }> };
    } | null;
    const reason = body?.error?.details?.find((detail) => detail.reason)?.reason
      ?? body?.error?.errors?.[0]?.reason ?? body?.error?.status ?? "unknown";
    console.error("YouTube Data API request failed", { path, status: response.status, reason });
    throw new YouTubeApiError(response.status, reason);
  }
  return response.json();
}

export async function searchYouTubeVideos(name: string, artists: string): Promise<YouTubeCandidate[]> {
  const data = await youtubeGet("search", {
    part: "snippet",
    q: `${artists} ${name} official music video`,
    type: "video",
    videoEmbeddable: "true",
    maxResults: "6",
  }) as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }> };
  return (data.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return [];
    return [{
      videoId,
      title: item.snippet?.title ?? "제목 없음",
      channelTitle: item.snippet?.channelTitle ?? "채널 정보 없음",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    }];
  });
}

export async function getEmbeddableYouTubeVideo(videoId: string) {
  const data = await youtubeGet("videos", { part: "snippet,status", id: videoId }) as {
    items?: Array<{ snippet?: { title?: string }; status?: { embeddable?: boolean; privacyStatus?: string } }>;
  };
  const video = data.items?.[0];
  if (!video || !video.status?.embeddable || video.status.privacyStatus !== "public") return null;
  return { videoId, title: video.snippet?.title ?? "YouTube 영상" };
}
