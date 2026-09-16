import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  createAdmissionToken,
  QUEUE_ADMISSION_COOKIE,
  QUEUE_VISITOR_COOKIE,
  queueSigningSecret,
} from "@/lib/queue-token";
import {
  enterOrRefreshQueue,
  QUEUE_LEASE_SECONDS,
  WAITING_ROOM_CAPACITY,
  waitingRoomEnabled,
} from "@/lib/waiting-room";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!waitingRoomEnabled())
    return NextResponse.json({ admitted: true, disabled: true });

  const secret = queueSigningSecret();
  if (!secret || secret.length < 32)
    return NextResponse.json(
      { error: "대기열 서명 키가 설정되지 않았어요." },
      { status: 503 },
    );

  const storedVisitorId = request.cookies.get(QUEUE_VISITOR_COOKIE)?.value;
  const visitorId = /^[0-9a-f-]{36}$/iu.test(storedVisitorId ?? "")
    ? storedVisitorId!
    : randomUUID();

  try {
    const status = await enterOrRefreshQueue(visitorId);
    const response = NextResponse.json({
      admitted: status.admitted,
      active: status.active,
      position: status.position,
      capacity: WAITING_ROOM_CAPACITY,
    });
    response.cookies.set(QUEUE_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    if (status.admitted) {
      response.cookies.set(
        QUEUE_ADMISSION_COOKIE,
        await createAdmissionToken(visitorId, status.expiresAt, secret),
        {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: QUEUE_LEASE_SECONDS,
        },
      );
    }
    return response;
  } catch (error) {
    console.error("Waiting room Redis request failed", error);
    return NextResponse.json(
      { error: "대기열에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
