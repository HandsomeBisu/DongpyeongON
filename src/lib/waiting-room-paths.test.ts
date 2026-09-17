import { describe, expect, it } from "vitest";
import { isWaitingRoomPublicPath } from "./waiting-room-paths";

describe("isWaitingRoomPublicPath", () => {
  it.each([
    "/",
    "/login",
    "/privacy",
    "/terms",
    "/api/announcements",
    "/api/auth/email-verification/request",
  ])("keeps %s publicly accessible", (pathname) => {
    expect(isWaitingRoomPublicPath(pathname)).toBe(true);
  });

  it.each(["/community", "/music", "/post/new", "/api/posts"])(
    "keeps %s behind the waiting room",
    (pathname) => {
      expect(isWaitingRoomPublicPath(pathname)).toBe(false);
    },
  );
});
