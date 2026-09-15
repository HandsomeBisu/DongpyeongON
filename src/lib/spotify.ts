import "server-only";

import type { SpotifyTrack } from "@/types/spotify";

let accessToken = "";
let accessTokenExpiresAt = 0;

type SpotifyTrackResponse = {
  id: string;
  name: string;
  artists?: Array<{ name?: string }>;
  album?: { name?: string; images?: Array<{ url?: string }> };
  duration_ms?: number;
  explicit?: boolean;
  external_urls?: { spotify?: string };
  uri?: string;
};

export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    public retryAfter?: number,
    public operation: "token" | "search" | "track" = "search",
    public code?: string,
  ) {
    super(status === 429 ? "SPOTIFY_RATE_LIMIT" : "SPOTIFY_API_ERROR");
  }
}

export function spotifyCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("SPOTIFY_NOT_CONFIGURED");
  return { clientId, clientSecret };
}

async function getAccessToken() {
  if (accessToken && Date.now() < accessTokenExpiresAt) return accessToken;
  const { clientId, clientSecret } = spotifyCredentials();
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new SpotifyApiError(response.status, undefined, "token", error.error);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 60) * 1000;
  return accessToken;
}

function mapTrack(track: SpotifyTrackResponse): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artists:
      track.artists
        ?.map((artist) => artist.name)
        .filter(Boolean)
        .join(", ") || "알 수 없는 아티스트",
    albumName: track.album?.name || "앨범 정보 없음",
    albumImageUrl: track.album?.images?.[0]?.url || null,
    durationMs: track.duration_ms ?? 0,
    explicit: track.explicit === true,
    spotifyUrl:
      track.external_urls?.spotify ||
      `https://open.spotify.com/track/${track.id}`,
    uri: track.uri || `spotify:track:${track.id}`,
  };
}

async function spotifyFetch(path: string, operation: "search" | "track") {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const data = (await response.json().catch(() => ({}))) as {
      error?: { reason?: string };
    };
    throw new SpotifyApiError(
      response.status,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
      operation,
      data.error?.reason,
    );
  }
  return response;
}

export async function searchSpotifyTracks(query: string, offset = 0) {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    market: "KR",
    limit: "10",
    offset: String(offset),
  });
  const response = await spotifyFetch(`/search?${params}`, "search");
  const data = (await response.json()) as {
    tracks?: {
      items?: SpotifyTrackResponse[];
      next?: string | null;
      total?: number;
    };
  };
  const items = data.tracks?.items ?? [];
  return {
    tracks: items
      .filter((track) => Boolean(track.id && track.name))
      .map(mapTrack),
    hasMore: Boolean(data.tracks?.next),
    nextOffset: offset + items.length,
    total: data.tracks?.total ?? items.length,
  };
}

export async function getSpotifyTrack(trackId: string) {
  const response = await spotifyFetch(
    `/tracks/${encodeURIComponent(trackId)}?market=KR`,
    "track",
  );
  return mapTrack((await response.json()) as SpotifyTrackResponse);
}
