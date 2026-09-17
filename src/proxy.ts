import { NextResponse, type NextRequest } from "next/server";
import {
  QUEUE_ADMISSION_COOKIE,
  queueSigningSecret,
  verifyAdmissionToken,
} from "@/lib/queue-token";
import { isWaitingRoomPublicPath } from "@/lib/waiting-room-paths";

export async function proxy(request: NextRequest) {
  if (process.env.WAITING_ROOM_ENABLED !== "true") return NextResponse.next();
  if (isWaitingRoomPublicPath(request.nextUrl.pathname))
    return NextResponse.next();

  const secret = queueSigningSecret();
  const admitted =
    secret &&
    (await verifyAdmissionToken(
      request.cookies.get(QUEUE_ADMISSION_COOKIE)?.value,
      secret,
    ));
  if (admitted) return NextResponse.next();

  const waitingUrl = new URL("/waiting", request.url);
  if (request.nextUrl.pathname !== "/")
    waitingUrl.searchParams.set(
      "returnTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  return NextResponse.redirect(waitingUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
