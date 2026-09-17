const PUBLIC_WAITING_ROOM_PATHS = [
  "/",
  "/login",
  "/verify-email",
  "/onboarding",
  "/privacy",
  "/terms",
  "/waiting",
  "/api/queue",
  "/api/announcements",
  "/api/school/meal",
  "/api/auth/email-verification",
] as const;

export function isWaitingRoomPublicPath(pathname: string) {
  return PUBLIC_WAITING_ROOM_PATHS.some(
    (path) =>
      pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}
