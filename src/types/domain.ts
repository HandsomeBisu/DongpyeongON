export const USER_ROLES = ["general", "student_council", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(value: unknown): UserRole {
  if (value === "admin") return "admin";
  if (value === "student_council" || value === "teacher")
    return "student_council";
  return "general";
}

export type ContentStatus = "published" | "hidden" | "deleted";

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  name: string;
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  onboardingCompleted: boolean;
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
