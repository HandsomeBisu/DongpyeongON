import { z } from "zod";

export const studentProfileSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상 입력해 주세요.").max(20, "이름은 20자 이하로 입력해 주세요."),
  grade: z.number().int().min(1).max(3),
  classNumber: z.number().int().min(1).max(6),
  studentNumber: z.number().int().min(1).max(30),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: "student" | "teacher" | "admin";
  name: string;
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  onboardingCompleted: boolean;
};

export function profileFromData(
  fallback: { uid: string; email: string | null; displayName: string | null; photoURL: string | null },
  data: Record<string, unknown>,
): UserProfile {
  const parsed = studentProfileSchema.safeParse({
    name: data.name,
    grade: data.grade,
    classNumber: data.classNumber,
    studentNumber: data.studentNumber,
  });
  const role = data.role === "teacher" || data.role === "admin" ? data.role : "student";
  const displayName = typeof data.displayName === "string" ? data.displayName : fallback.displayName || "동평 학생";

  return {
    uid: fallback.uid,
    email: typeof data.email === "string" ? data.email : fallback.email || "",
    displayName,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : fallback.photoURL,
    role,
    name: parsed.success ? parsed.data.name : displayName,
    grade: parsed.success ? parsed.data.grade : null,
    classNumber: parsed.success ? parsed.data.classNumber : null,
    studentNumber: parsed.success ? parsed.data.studentNumber : null,
    onboardingCompleted: data.onboardingCompleted === true && parsed.success,
  };
}
