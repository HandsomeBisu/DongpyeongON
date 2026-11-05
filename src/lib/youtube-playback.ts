export type PlaybackSample = { time: number; position: number };

export function watchedTimeBetween(previous: PlaybackSample | null, current: PlaybackSample, playing: boolean) {
  if (!playing || !previous) return 0;
  return Math.max(0, Math.min(
    (current.time - previous.time) / 1_000,
    current.position - previous.position,
  ));
}

export function canSkipAfterHalf(duration: number, watchedSeconds: number) {
  return Number.isFinite(duration) && duration > 0 && watchedSeconds >= duration / 2;
}

export function isNearVideoEnd(duration: number, position: number) {
  return Number.isFinite(duration) && duration > 3 && position >= duration - 3;
}
