import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSongRequestWindow } from "@/lib/request-window";
import { getSpotifyTrack, SpotifyApiError } from "@/lib/spotify";

const requestSchema = z.object({
  trackId: z.string().regex(/^[A-Za-z0-9]{22}$/),
});

function serialize(data: FirebaseFirestore.DocumentData, id: string) {
  const date = (value: unknown) =>
    value instanceof Timestamp ? value.toDate().toISOString() : null;
  return {
    ...data,
    id,
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
    limitResetsAt: date(data.limitResetsAt),
  };
}

async function requestedTrackIdsForWindow(
  collection: FirebaseFirestore.CollectionReference,
  windowKey: string,
) {
  const prefix = `${windowKey}_`;
  const snapshot = await collection
    .orderBy(FieldPath.documentId())
    .startAt(prefix)
    .endBefore(`${prefix}\uf8ff`)
    .select("spotifyTrackId")
    .get();
  return [
    ...new Set(
      snapshot.docs
        .map((document) => document.data().spotifyTrackId)
        .filter((trackId): trackId is string => typeof trackId === "string"),
    ),
  ];
}

export async function GET(request: Request) {
  try {
    const { user } = await verifyOnboardedApiRequest(request);
    const window = getSongRequestWindow();
    const id = `${window.key}_${user.uid}`;
    const collection = getAdminDb().collection("songRequests");
    const [snapshot, requestedTrackIds] = await Promise.all([
      collection.doc(id).get(),
      requestedTrackIdsForWindow(collection, window.key),
    ]);
    return Response.json({
      request: snapshot.exists
        ? serialize(snapshot.data() ?? {}, snapshot.id)
        : null,
      requestedTrackIds,
      limitResetsAt: window.end.toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await verifyOnboardedApiRequest(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "올바른 곡을 선택해 주세요." },
        { status: 400 },
      );
    const window = getSongRequestWindow();
    const id = `${window.key}_${user.uid}`;
    const database = getAdminDb();
    const collection = database.collection("songRequests");
    const reference = collection.doc(id);

    const existing = await reference.get();
    if (existing.exists)
      return Response.json(
        {
          error: "오늘은 이미 한 곡을 신청했어요.",
          request: serialize(existing.data() ?? {}, existing.id),
          limitResetsAt: window.end.toISOString(),
        },
        { status: 409 },
      );

    const track = await getSpotifyTrack(parsed.data.trackId);
    if (track.explicit)
      return Response.json(
        { error: "19세 이용가로 분류된 노래는 신청할 수 없어요." },
        { status: 422 },
      );

    const requestedTrackIds = await requestedTrackIdsForWindow(
      collection,
      window.key,
    );
    if (requestedTrackIds.includes(track.id))
      return Response.json(
        {
          error: "이 노래는 오늘 이미 신청되었어요. 다른 노래를 선택해 주세요.",
          duplicateTrackId: track.id,
        },
        { status: 409 },
      );

    const requestedByName =
      typeof profile.name === "string"
        ? profile.name
        : user.name || "동평 학생";
    const requesterLabel = [
      profile.grade && `${profile.grade}학년`,
      profile.classNumber && `${profile.classNumber}반`,
      profile.studentNumber && `${profile.studentNumber}번`,
    ]
      .filter(Boolean)
      .join(" ");
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

    const trackLock = database
      .collection("songRequestTrackLocks")
      .doc(`${window.key}_${track.id}`);
    const transactionResult = await database.runTransaction(
      async (transaction) => {
        const currentRequest = await transaction.get(reference);
        if (currentRequest.exists)
          return {
            status: "user-exists" as const,
            data: currentRequest.data() ?? {},
          };
        const currentTrackLock = await transaction.get(trackLock);
        if (currentTrackLock.exists) return { status: "track-exists" as const };
        transaction.create(reference, songRequest);
        transaction.create(trackLock, {
          requestId: id,
          spotifyTrackId,
          windowKey: window.key,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { status: "created" as const };
      },
    );

    if (transactionResult.status === "user-exists")
      return Response.json(
        {
          error: "오늘은 이미 한 곡을 신청했어요.",
          request: serialize(transactionResult.data, id),
          limitResetsAt: window.end.toISOString(),
        },
        { status: 409 },
      );
    if (transactionResult.status === "track-exists")
      return Response.json(
        {
          error: "이 노래는 오늘 이미 신청되었어요. 다른 노래를 선택해 주세요.",
          duplicateTrackId: track.id,
        },
        { status: 409 },
      );

    return Response.json(
      {
        request: {
          ...songRequest,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          limitResetsAt: window.end.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SpotifyApiError)
      return Response.json(
        {
          error:
            error.status === 429
              ? "Spotify 요청이 많아요. 잠시 후 다시 시도해 주세요."
              : "곡 정보를 확인하지 못했어요.",
          retryAfter: error.retryAfter,
        },
        { status: error.status === 429 ? 429 : 502 },
      );
    if (error instanceof Error && error.message === "SPOTIFY_NOT_CONFIGURED")
      return Response.json(
        { error: "Spotify 환경 변수가 설정되지 않았습니다." },
        { status: 503 },
      );
    return apiError(error);
  }
}
