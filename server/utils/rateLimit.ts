/**
 * Tiny fixed-window, per-key request limiter held in process memory.
 *
 * Free-tier friendly: no external store. On Vercel Fluid compute one warm instance serves
 * many requests, so this stops a single client hammering the API; it is not a global
 * guarantee (each instance counts separately). Requests answered by the CDN cache never
 * reach a function, so only cache misses count against the limit.
 *
 * @module server/utils/rateLimit
 */

export interface RateLimitResult {
  allowed: boolean
  /** Requests left in the current window (0 when blocked). */
  remaining: number
  /** Seconds until the window resets. */
  resetSec: number
}

interface Window {
  start: number
  count: number
}

export class FixedWindowLimiter {
  private readonly windows = new Map<string, Window>()

  /**
   * @param limit - Requests allowed per window
   * @param windowMs - Window length in milliseconds
   * @param maxKeys - Memory bound; expired windows are swept when exceeded
   */
  constructor(
    readonly limit: number,
    readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  hit(key: string, now = Date.now()): RateLimitResult {
    let w = this.windows.get(key)
    if (!w || now - w.start >= this.windowMs) {
      if (!w && this.windows.size >= this.maxKeys) this.sweep(now)
      w = { start: now, count: 0 }
      this.windows.set(key, w)
    }
    w.count++
    const resetSec = Math.max(1, Math.ceil((w.start + this.windowMs - now) / 1000))
    return {
      allowed: w.count <= this.limit,
      remaining: Math.max(0, this.limit - w.count),
      resetSec,
    }
  }

  private sweep(now: number): void {
    for (const [k, w] of this.windows) {
      if (now - w.start >= this.windowMs) this.windows.delete(k)
    }
    // Still full (a flood of distinct IPs): drop the oldest half rather than grow unbounded.
    if (this.windows.size >= this.maxKeys) {
      let drop = Math.floor(this.windows.size / 2)
      for (const k of this.windows.keys()) {
        if (drop-- <= 0) break
        this.windows.delete(k)
      }
    }
  }
}
