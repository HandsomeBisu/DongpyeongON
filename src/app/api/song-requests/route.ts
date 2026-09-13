import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSongRequestWindow } from "@/lib/request-window";
import { getSpotifyTrack, SpotifyApiError } from "@/lib/spotify";

const requestSchema = z.object({ trackId: z.string().regex(/^[A-Za-z0-9]{22}$/) });

function serialize(data: FirebaseFirestore.DocumentData, id: string) {
  const date = (value: unknown) => value instanceof Timestamp ? value.toDate().toISOString() : null;
  return { ...data, id, createdAt: date(data.createdAt), updatedAt: date(data.updatedAt), limitResetsAt: date(data.limitResetsAt) };
}

export async function GET(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const window = getSongRequestWindow();
    const id = `${window.key}_${user.uid}`;
    const snapshot = await getAdminDb().collection("songRequests").doc(id).get();
    return Response.json({ request: snapshot.exists ? serialize(snapshot.data() ?? {}, snapshot.id) : null, limitResetsAt: window.end.toISOString() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await verifyOnboardedApiRequest(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "올바른 곡을 선택해 주세요." }, { status: 400 });
    const window = getSongRequestWindow();
    const id = `${window.key}_${user.uid}`;
    const reference = getAdminDb().collection("songRequests").doc(id);

    const existing = await reference.get();
    if (existing.exists) return Response.json({ error: "오늘은 이미 한 곡을 신청했어요.", request: serialize(existing.data() ?? {}, existing.id), limitResetsAt: window.end.toISOString() }, { status: 409 });

    const track = await getSpotifyTrack(parsed.data.trackId);
    const requestedByName = typeof profile.name === "string" ? profile.name : user.name || "동평 학생";
    const requesterLabel = [profile.grade && `${profile.grade}학년`, profile.classNumber && `${profile.classNumber}반`, profile.studentNumber && `${profile.studentNumber}번`].filter(Boolean).join(" ");
    const { id: spotifyTrackId, ...trackData } = track;
    const songRequest = {
      ...trackData,
      spotifyTrackId,
      requestedBy: user.uid,
      requestedByName,
      requesterLabel,
      status: "pending",
      windowKey: window.key,
      limitResetsAt: Timestamp.fromDate(window.end),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      await reference.create(songRequest);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "6" || code === "already-exists") {
        const duplicate = await reference.get();
        return Response.json({ error: "오늘은 이미 한 곡을 신청했어요.", request: duplicate.exists ? serialize(duplicate.data() ?? {}, duplicate.id) : null, limitResetsAt: window.end.toISOString() }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ request: { ...songRequest, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), limitResetsAt: window.end.toISOString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof SpotifyApiError) return Response.json({ error: error.status === 429 ? "Spotify 요청이 많아요. 잠시 후 다시 시도해 주세요." : "곡 정보를 확인하지 못했어요.", retryAfter: error.retryAfter }, { status: error.status === 429 ? 429 : 502 });
    if (error instanceof Error && error.message === "SPOTIFY_NOT_CONFIGURED") return Response.json({ error: "Spotify 환경 변수가 설정되지 않았습니다." }, { status: 503 });
    return apiError(error);
  }
}
