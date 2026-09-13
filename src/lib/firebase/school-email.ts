export const SCHOOL_EMAIL_DOMAIN = "dongpyeong.ms.kr";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isSchoolEmail(email: string) {
  const normalized = normalizeEmail(email);
  const suffix = `@${SCHOOL_EMAIL_DOMAIN}`;
  return normalized.length > suffix.length && normalized.endsWith(suffix);
}
