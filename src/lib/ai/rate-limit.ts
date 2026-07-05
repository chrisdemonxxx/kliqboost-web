// Basic per-user rate limiting for AI generation (KLI-5 "add basic per-user
// rate limiting"). This is an in-memory, per-instance limiter: adequate for a
// single-instance deploy and demo mode, but on serverless it is per-lambda and
// so a soft limit rather than a hard one. The durable version is a shared
// Postgres-backed counter (KLI-9 #1) that activates once Supabase is live.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function checkRateLimit(userId: string, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(userId);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
