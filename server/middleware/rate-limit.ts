/**
 * Per-IP rate limiting for `/api/*` (Vercel's Firewall rate limits need a paid plan).
 *
 * - All API routes: 120 requests / minute / IP (a home page load is ~15).
 * - Orbit graph builds: 20 / minute / IP on top of that, since each miss fans out to
 *   ~40 TMDB calls.
 *
 * Over the limit → 429 with `Retry-After`. Requests without a client IP (internal SSR
 * fetches) are not limited.
 */
import { FixedWindowLimiter } from '../utils/rateLimit'

const apiLimiter = new FixedWindowLimiter(120, 60_000)
const graphLimiter = new FixedWindowLimiter(20, 60_000)

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) return

  const checks = [apiLimiter.hit(ip)]
  if (/^\/api\/actors\/[^/]+\/graph/.test(path)) checks.push(graphLimiter.hit(ip))

  const blocked = checks.find(r => !r.allowed)
  const tightest = blocked || checks.reduce((a, b) => (b.remaining < a.remaining ? b : a))
  setResponseHeader(event, 'X-RateLimit-Remaining', String(tightest.remaining))

  if (blocked) {
    setResponseHeader(event, 'Retry-After', String(blocked.resetSec))
    setResponseHeader(event, 'Cache-Control', 'no-store')
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests, please slow down',
    })
  }
})
