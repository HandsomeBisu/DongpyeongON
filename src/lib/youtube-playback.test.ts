import { describe, expect, it } from "vitest";
import { canSkipAfterHalf, isNearVideoEnd, watchedTimeBetween } from "./youtube-playback";

describe("YouTube playback timing", () => {
  it("counts playback time without counting a forward seek as watched time", () => {
    expect(watchedTimeBetween({ time: 1_000, position: 10 }, { time: 1_250, position: 10.25 }, true)).toBeCloseTo(0.25);
    expect(watchedTimeBetween({ time: 1_250, position: 10.25 }, { time: 1_500, position: 90 }, true)).toBeCloseTo(0.25);
    expect(watchedTimeBetween({ time: 1_500, position: 90 }, { time: 1_750, position: 90.25 }, false)).toBe(0);
    expect(watchedTimeBetween({ time: 1_750, position: 90.25 }, { time: 2_000, position: 5 }, true)).toBe(0);
  });

  it("allows skipping only after half of a known duration", () => {
    expect(canSkipAfterHalf(120, 59.9)).toBe(false);
    expect(canSkipAfterHalf(120, 60)).toBe(true);
    expect(canSkipAfterHalf(0, 60)).toBe(false);
  });

  it("starts the transition at three seconds remaining", () => {
    expect(isNearVideoEnd(120, 116.9)).toBe(false);
    expect(isNearVideoEnd(120, 117)).toBe(true);
  });
});
