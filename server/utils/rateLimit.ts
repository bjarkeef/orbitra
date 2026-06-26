/**
 * Simple sliding-window rate limiter for Nitro (process-local, per IP).
 * Not shared across instances — acceptable for Orbitra's single-node deploys.
 *
 * @module server/utils/rateLimit
 */

interface Bucket {
  /** Epoch ms timestamps of recent hits */
  hits: number[]
}

const buckets = new Map<string, Bucket>()

/** Prune empty / stale buckets occasionally to avoid unbounded growth. */
let pruneCounter = 0

/**
 * Record a hit and return whether the caller is still under the limit.
 *
 * @param key - Bucket key (e.g. `adult:${ip}`)
 * @param limit - Max hits in the window
 * @param windowMs - Window length in milliseconds
 * @returns `{ allowed, remaining, retryAfterSec }`
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { hits: [] }
    buckets.set(key, bucket)
  }

  const cutoff = now - windowMs
  bucket.hits = bucket.hits.filter((t) => t > cutoff)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  bucket.hits.push(now)

  pruneCounter += 1
  if (pruneCounter % 200 === 0) {
    for (const [k, b] of buckets) {
      b.hits = b.hits.filter((t) => t > cutoff)
      if (!b.hits.length) buckets.delete(k)
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    retryAfterSec: 0,
  }
}

/**
 * Best-effort client IP for rate limiting (respects common proxy headers).
 */
export function clientIpFromEvent(event: { node?: { req?: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } } }; headers?: Headers }): string {
  const h = event.node?.req?.headers || {}
  const xf = h['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim()
  }
  if (Array.isArray(xf) && xf[0]) {
    return String(xf[0]).split(',')[0].trim()
  }
  const realIp = h['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim()
  return event.node?.req?.socket?.remoteAddress || 'unknown'
}
