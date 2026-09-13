import { describe, expect, it } from "vitest";
import { getSongRequestWindow } from "./request-window";

describe("getSongRequestWindow", () => {
  it("오전 7시 직전에는 전날 신청 구간을 사용한다", () => {
    const window = getSongRequestWindow(new Date("2026-09-12T21:59:59.000Z"));
    expect(window.key).toBe("2026-09-12");
    expect(window.end.toISOString()).toBe("2026-09-12T22:00:00.000Z");
  });

  it("오전 7시에 새로운 신청 구간을 시작한다", () => {
    const window = getSongRequestWindow(new Date("2026-09-12T22:00:00.000Z"));
    expect(window.key).toBe("2026-09-13");
    expect(window.start.toISOString()).toBe("2026-09-12T22:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-09-13T22:00:00.000Z");
  });
});
