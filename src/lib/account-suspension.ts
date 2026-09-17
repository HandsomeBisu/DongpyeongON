export type AccountSuspension = {
  reason: string;
  startsAt: number;
  endsAt: number;
};

function timestampToMillis(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return null;
}

export function parseAccountSuspension(
  value: unknown,
): AccountSuspension | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const reason = typeof record.reason === "string" ? record.reason.trim() : "";
  const startsAt = timestampToMillis(record.startsAt);
  const endsAt = timestampToMillis(record.endsAt);
  if (!reason || startsAt === null || endsAt === null || endsAt <= startsAt)
    return null;
  return { reason, startsAt, endsAt };
}

export function isAccountSuspended(
  suspension: AccountSuspension | null | undefined,
  now = Date.now(),
) {
  return Boolean(suspension && suspension.endsAt > now);
}
