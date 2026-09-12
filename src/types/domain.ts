export type UserRole = "student" | "teacher" | "admin";

export type ContentStatus = "published" | "hidden" | "deleted";

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  category: string;
  status: ContentStatus;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Suggestion {
  id: string;
  authorId: string | null;
  category: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: "submitted" | "reviewing" | "answered" | "closed";
  answer?: string;
  createdAt: Date;
  answeredAt?: Date;
}

export interface SongRequest {
  id: string;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumImageUrl: string;
  requestedBy: string;
  message?: string;
  status: "pending" | "approved" | "rejected" | "played";
  createdAt: Date;
}
