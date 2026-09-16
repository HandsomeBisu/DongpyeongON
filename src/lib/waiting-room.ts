import "server-only";

const ACTIVE_KEY = "dpon:queue:active";
const WAITING_KEY = "dpon:queue:waiting";
const WAITING_SEEN_KEY = "dpon:queue:waiting-seen";

export const WAITING_ROOM_CAPACITY = 100;
export const QUEUE_LEASE_SECONDS = 180;
const WAITING_STALE_SECONDS = 120;

const ADMIT_SCRIPT = `
local visitor = ARGV[1]
local now = tonumber(ARGV[2])
local expires = tonumber(ARGV[3])
local capacity = tonumber(ARGV[4])
local joined = tonumber(ARGV[5])
local waitingCutoff = tonumber(ARGV[6])

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local stale = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', waitingCutoff)
for _, member in ipairs(stale) do
  redis.call('ZREM', KEYS[2], member)
  redis.call('ZREM', KEYS[3], member)
end

if redis.call('ZSCORE', KEYS[1], visitor) then
  redis.call('ZADD', KEYS[1], expires, visitor)
  redis.call('ZREM', KEYS[2], visitor)
  redis.call('ZREM', KEYS[3], visitor)
  return {1, redis.call('ZCARD', KEYS[1]), 0}
end

redis.call('ZADD', KEYS[2], 'NX', joined, visitor)
redis.call('ZADD', KEYS[3], now, visitor)
local rank = redis.call('ZRANK', KEYS[2], visitor)
local active = tonumber(redis.call('ZCARD', KEYS[1]))
local available = capacity - active

if rank and rank < available then
  redis.call('ZADD', KEYS[1], expires, visitor)
  redis.call('ZREM', KEYS[2], visitor)
  redis.call('ZREM', KEYS[3], visitor)
  return {1, active + 1, 0}
end

return {0, active, rank and rank + 1 or 1}
`;

type RedisResponse<T> = { result?: T; error?: string };

function redisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("WAITING_ROOM_REDIS_NOT_CONFIGURED");
  return { url: url.replace(/\/$/u, ""), token };
}

async function redisCommand<T>(command: Array<string | number>) {
  const { url, token } = redisCredentials();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  const payload = (await response.json().catch(() => ({}))) as RedisResponse<T>;
  if (!response.ok || payload.error || payload.result === undefined)
    throw new Error(payload.error || "WAITING_ROOM_REDIS_FAILED");
  return payload.result;
}

export function waitingRoomEnabled() {
  return process.env.WAITING_ROOM_ENABLED === "true";
}

export async function enterOrRefreshQueue(visitorId: string) {
  const now = Date.now();
  const expiresAt = now + QUEUE_LEASE_SECONDS * 1_000;
  const result = await redisCommand<[number, number, number]>([
    "EVAL",
    ADMIT_SCRIPT,
    3,
    ACTIVE_KEY,
    WAITING_KEY,
    WAITING_SEEN_KEY,
    visitorId,
    now,
    expiresAt,
    WAITING_ROOM_CAPACITY,
    now,
    now - WAITING_STALE_SECONDS * 1_000,
  ]);
  return {
    admitted: Number(result[0]) === 1,
    active: Number(result[1]),
    position: Number(result[2]),
    expiresAt,
  };
}
