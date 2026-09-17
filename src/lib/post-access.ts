export function canViewPost(status: unknown, role: unknown) {
  return status === "published" || role === "admin";
}
