/**
 * Process-local TTL cache for Nitro handlers (single instance only — not shared across deploys).
 * Use to avoid re-hitting upstream APIs (e.g. TMDB) on repeated user traffic.
 *
 * @module server/utils/memoryCache
 */

export interface MemoryCacheEntry<T> {
  expires: number
  data: T
}

export interface MemoryCacheOptions {
  /** Hard cap on entries; oldest insertion key is dropped when exceeded. Default 500. */
  maxEntries?: number
}

/**
 * Tiny in-memory key/value store with expiry and optional size bound.
 *
 * @typeParam T - Cached value type
 */
export class MemoryCache<T> {
  private readonly store = new Map<string, MemoryCacheEntry<T>>()
  private readonly maxEntries: number

  constructor(options: MemoryCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 500
  }

  /**
   * Read a non-expired entry.
   *
   * @param key - Cache key
   * @returns Value or `undefined` on miss / expiry
   */
  get(key: string): T | undefined {
    const hit = this.store.get(key)
    if (!hit) return undefined
    if (hit.expires <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return hit.data
  }

  /**
   * Store a value until `ttlMs` elapses.
   *
   * @param key - Cache key
   * @param data - Serializable-ish payload (held by reference in memory)
   * @param ttlMs - Time to live in milliseconds
   */
  set(key: string, data: T, ttlMs: number): void {
    if (ttlMs <= 0) return

    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }

    this.store.set(key, { expires: Date.now() + ttlMs, data })
  }

  /** Drop one key. */
  delete(key: string): void {
    this.store.delete(key)
  }

  /** Clear everything (tests / admin). */
  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

/**
 * Build a stable cache key from a path and query object (order-independent for plain values).
 * Does not include secrets such as `api_key`.
 *
 * @param path - Resource path (e.g. `movie/550`)
 * @param query - Incoming query bag (api_key stripped if present)
 */
export function cacheKeyFromPathQuery(
  path: string,
  query: Record<string, unknown>,
): string {
  const parts: string[] = []
  const keys = Object.keys(query).filter((k) => k !== 'api_key').sort()
  for (const key of keys) {
    const value = query[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      parts.push(`${key}=${value.map(String).sort().join(',')}`)
    } else {
      parts.push(`${key}=${String(value)}`)
    }
  }
  return parts.length ? `${path}?${parts.join('&')}` : path
}

function msMinutes(n: number): number {
  return Math.round(n * 60_000)
}

/**
 * TTL policy for TMDB proxy routes — longer for stable detail payloads, shorter for search/lists.
 *
 * @param segments - Path segments under `/3/` (e.g. `['movie','550']`)
 * @returns TTL in ms
 */
export function tmdbProxyTtlMs(segments: string[]): number {
  const root = (segments[0] || '').toLowerCase()
  const leaf = (segments[segments.length - 1] || '').toLowerCase()

  // User-typed search: short so new queries stay fresh, same query still de-dupes
  if (root === 'search') return msMinutes(3)

  // Time-sensitive / feed-like lists
  if (root === 'trending') return msMinutes(10)
  if (
    leaf === 'now_playing' ||
    leaf === 'upcoming' ||
    leaf === 'airing_today' ||
    leaf === 'on_the_air'
  ) {
    return msMinutes(10)
  }
  if (root === 'discover' || leaf === 'popular' || leaf === 'top_rated') {
    return msMinutes(15)
  }

  // Credits / providers / videos / external_ids on a title
  if (
    leaf === 'credits' ||
    leaf === 'combined_credits' ||
    leaf === 'videos' ||
    leaf === 'external_ids' ||
    leaf === 'images' ||
    segments.includes('watch')
  ) {
    return msMinutes(45)
  }

  // Season / episode payloads
  if (segments.includes('season') || segments.includes('episode')) {
    return msMinutes(30)
  }

  // Person / movie / tv / collection detail (and similar)
  if (
    root === 'movie' ||
    root === 'tv' ||
    root === 'person' ||
    root === 'collection' ||
    root === 'network' ||
    root === 'company' ||
    root === 'genre'
  ) {
    return msMinutes(60)
  }

  // Fallback for anything else we proxy
  return msMinutes(15)
}
