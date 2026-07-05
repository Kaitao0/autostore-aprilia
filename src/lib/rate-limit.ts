/**
 * In-memory sliding-window rate limiter for Server Actions.
 * Per-instance only (resets on deploy/restart; not shared across
 * serverless instances) — adequate as an anti-abuse speed bump for
 * public forms alongside the honeypot. Swap for Upstash/Redis if the
 * project ever needs a hard guarantee.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Bounded memory: drop the oldest buckets when the map grows too big.
  if (buckets.size > MAX_BUCKETS) {
    const firstKey = buckets.keys().next().value;
    if (firstKey !== undefined) buckets.delete(firstKey);
  }

  return { ok: true, retryAfterSeconds: 0 };
}
