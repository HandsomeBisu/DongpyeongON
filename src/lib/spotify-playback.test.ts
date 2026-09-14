import { describe, expect, it } from "vitest";
import { didTrackNaturallyComplete, type PlaybackSnapshot } from "./spotify-playback";

const previous: PlaybackSnapshot = {
  uri: "spotify:track:first",
  position: 176_000,
  duration: 180_000,
  paused: false,
  observedAt: 1_000,
};

describe("didTrackNaturallyComplete", () => {
  it("detects a natural transition to the next track", () => {
    const current = { ...previous, uri: "spotify:track:next", position: 0, observedAt: 2_000 };
    expect(didTrackNaturallyComplete(previous, current, 2_000, 0)).toBe(true);
  });

  it("detects the final track stopping at the beginning", () => {
    const current = { ...previous, position: 0, paused: true, observedAt: 2_000 };
    expect(didTrackNaturallyComplete(previous, current, 2_000, 0)).toBe(true);
  });

  it("detects consecutive plays of the same Spotify track", () => {
    const current = { ...previous, position: 0, observedAt: 2_000 };
    expect(didTrackNaturallyComplete(previous, current, 2_000, 0)).toBe(true);
  });

  it("does not complete an early or manually skipped track", () => {
    const early = { ...previous, position: 20_000 };
    const next = { ...previous, uri: "spotify:track:next", position: 0, observedAt: 2_000 };
    expect(didTrackNaturallyComplete(early, next, 2_000, 0)).toBe(false);
    expect(didTrackNaturallyComplete(previous, next, 2_000, 4_000)).toBe(false);
  });
});
