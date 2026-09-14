export {};

declare global {
  namespace Spotify {
    type ErrorListener = ({ message }: { message: string }) => void;
    type PlaybackStateListener = (state: WebPlaybackState | null) => void;

    type WebPlaybackState = {
      duration: number;
      paused: boolean;
      position: number;
      track_window: {
        current_track: WebPlaybackTrack;
      };
    };

    type WebPlaybackTrack = {
      uri: string;
      name: string;
      album: { name: string; images: Array<{ url: string }> };
      artists: Array<{ name: string }>;
    };

    class Player {
      constructor(options: { name: string; getOAuthToken: (callback: (token: string) => void) => void; volume?: number });
      addListener(event: "ready" | "not_ready", listener: ({ device_id }: { device_id: string }) => void): boolean;
      addListener(event: "player_state_changed", listener: PlaybackStateListener): boolean;
      addListener(event: "initialization_error" | "authentication_error" | "account_error" | "playback_error", listener: ErrorListener): boolean;
      activateElement(): Promise<void>;
      connect(): Promise<boolean>;
      disconnect(): void;
      getCurrentState(): Promise<WebPlaybackState | null>;
      nextTrack(): Promise<void>;
      previousTrack(): Promise<void>;
      seek(positionMs: number): Promise<void>;
      setVolume(volume: number): Promise<void>;
      togglePlay(): Promise<void>;
    }
  }

  interface Window {
    Spotify?: { Player: typeof Spotify.Player };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
