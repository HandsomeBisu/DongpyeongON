export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  albumName: string;
  albumImageUrl: string | null;
  durationMs: number;
  explicit: boolean;
  spotifyUrl: string;
  uri: string;
};

export type SongRequestStatus = "pending" | "approved" | "rejected" | "played";

export type SongRequestRecord = Omit<SpotifyTrack, "id"> & {
  id: string;
  spotifyTrackId: string;
  requestedBy: string;
  requestedByName: string;
  requesterLabel: string;
  status: SongRequestStatus;
  windowKey: string;
  createdAt: string | null;
  updatedAt: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  playedAt?: string | null;
  limitResetsAt: string;
};
