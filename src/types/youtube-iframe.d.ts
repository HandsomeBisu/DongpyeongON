export {};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: {
        width: string;
        height: string;
        playerVars: { controls: number; disablekb: number; playsinline: number; origin: string };
        events: {
          onReady: () => void;
          onStateChange: (event: { data: number }) => void;
          onError: () => void;
          onAutoplayBlocked: () => void;
        };
      }) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YouTubePlayer = {
  destroy(): void;
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
};
