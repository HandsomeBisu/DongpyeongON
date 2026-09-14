export type PlaybackSnapshot = {
  uri: string;
  position: number;
  duration: number;
  paused: boolean;
  observedAt: number;
};

const COMPLETION_MARGIN_MS = 4_000;

export function didTrackNaturallyComplete(previous: PlaybackSnapshot | null, current: PlaybackSnapshot, now: number, suppressUntil: number) {
  if (!previous || previous.paused || previous.duration <= 0 || now < suppressUntil) return false;

  const estimatedPreviousPosition = previous.position + (now - previous.observedAt);
  const wasNearNaturalEnd = estimatedPreviousPosition >= previous.duration - COMPLETION_MARGIN_MS;
  const changedTrack = previous.uri !== current.uri;
  const restartedSameTrack = previous.uri === current.uri && current.position < 1_000 && previous.position > current.position;
  return wasNearNaturalEnd && (changedTrack || restartedSameTrack);
}
