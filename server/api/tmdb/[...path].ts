/**
 * Server-only TMDB v3 proxy with process-local response caching.
 *
 * Clients call `/api/tmdb/movie/550` (etc.); the browser never receives `TMDB_API`.
 * Successful responses are held in-memory per Nitro instance (not shared across hosts)
 * so repeat traffic for the same path+query does not hammer TMDB.
 *
 * Headers:
 * - `X-Orbitra-Cache: HIT|MISS` — local memory cache outcome
 * - `Cache-Control` — private max-age aligned with the entry TTL (browser/CDN hint only)
 *
 * @route GET /api/tmdb/**
 * @returns Opaque TMDB JSON (`unknown`) — shape depends on the upstream resource
 * @throws 400 invalid / missing path
 * @throws 500 missing server configuration
 * @throws 4xx/5xx mirrored (when possible) from TMDB upstream failures
 *
 * @module server/api/tmdb/[...path]
 */

import {
  MemoryCache,
  cacheKeyFromPathQuery,
  tmdbProxyTtlMs,
} from '../../utils/memoryCache'

/** Upstream TMDB error body (partial). */
interface TmdbUpstreamErrorBody {
  status_message?: string
  status_code?: number
  success?: boolean
}

/** Normalized fetch / ofetch failure fields we inspect. */
interface FetchErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: TmdbUpstreamErrorBody | string | null
  response?: { status?: number; _data?: TmdbUpstreamErrorBody }
  cause?: unknown
}

/** Successful handler result is passthrough TMDB JSON. */
export type TmdbProxyResponse = unknown

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

/** Shared by all requests in this Node process only. */
const responseCache = new MemoryCache<TmdbProxyResponse>({ maxEntries: 800 })

/**
 * In-flight upstream de-dupe: concurrent identical keys share one TMDB call.
 * Cleared when the promise settles so failures are not sticky.
 */
const inflight = new Map<string, Promise<TmdbProxyResponse>>()

/**
 * Split the catch-all `path` param into safe URL segments.
 *
 * @param pathParam - Nuxt/H3 `event.context.params.path`
 * @returns Non-empty segment list
 * @throws H3 error when empty or containing traversal tokens
 */
function resolvePathSegments(pathParam: string | string[] | undefined): string[] {
  const segments = Array.isArray(pathParam)
    ? pathParam.map(String).filter(Boolean)
    : typeof pathParam === 'string'
      ? pathParam.split('/').filter(Boolean)
      : []

  if (!segments.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing TMDB path. Use /api/tmdb/{resource}/...',
    })
  }

  if (segments.some((s) => s === '..' || s.includes('\\') || s.includes('\0'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  // Reject absolute URLs / protocol smuggling in a segment
  if (segments.some((s) => /^(https?:|\/\/)/i.test(s))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path segment' })
  }

  return segments
}

/**
 * Build upstream query string from the incoming request, stripping client `api_key`.
 *
 * @param query - Result of `getQuery(event)`
 * @param apiKey - Server TMDB key
 * @returns `URLSearchParams` including server `api_key`
 */
function buildUpstreamSearch(
  query: Record<string, unknown>,
  apiKey: string,
): URLSearchParams {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (key === 'api_key') continue
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined && v !== null) search.append(key, String(v))
      }
    } else {
      search.set(key, String(value))
    }
  }

  search.set('api_key', apiKey)
  return search
}

/**
 * Map an upstream / ofetch failure to a safe public H3 error.
 *
 * @param err - Unknown rejection from `$fetch`
 * @returns Never — always throws
 */
function rethrowAsH3(err: unknown): never {
  const e = (err ?? {}) as FetchErrorLike
  const statusRaw =
    e.response?.status ??
    e.statusCode ??
    (typeof e.data === 'object' && e.data && 'status_code' in e.data
      ? Number((e.data as TmdbUpstreamErrorBody).status_code)
      : undefined)
  const statusNum = Number(statusRaw)
  const status =
    Number.isFinite(statusNum) && statusNum >= 400 && statusNum < 600
      ? statusNum
      : 502

  let message = 'TMDB upstream request failed'
  if (typeof e.data === 'object' && e.data && 'status_message' in e.data) {
    const sm = (e.data as TmdbUpstreamErrorBody).status_message
    if (sm) message = String(sm)
  } else if (typeof e.data === 'string' && e.data.trim()) {
    message = e.data.trim().slice(0, 300)
  } else if (e.statusMessage) {
    message = String(e.statusMessage)
  } else if (e.message && !/^\[?\w+Error/i.test(e.message)) {
    message = String(e.message).slice(0, 300)
  }

  throw createError({
    statusCode: status,
    statusMessage: message,
  })
}

/**
 * Fetch TMDB once for this cache key, coalescing concurrent callers.
 *
 * @param cacheKey - Stable path+query key (no api_key)
 * @param tmdbUrl - Full upstream URL including server api_key
 * @param ttlMs - How long to retain a successful body
 */
async function fetchAndCache(
  cacheKey: string,
  tmdbUrl: string,
  ttlMs: number,
): Promise<TmdbProxyResponse> {
  const existing = inflight.get(cacheKey)
  if (existing) return existing

  const pending = (async () => {
    try {
      const body = await $fetch<TmdbProxyResponse>(tmdbUrl, {
        headers: { Accept: 'application/json' },
      })
      responseCache.set(cacheKey, body, ttlMs)
      return body
    } finally {
      inflight.delete(cacheKey)
    }
  })()

  inflight.set(cacheKey, pending)
  return pending
}

/**
 * Proxy handler: validate path, serve from local memory when possible, else TMDB v3.
 *
 * @param event - H3 event
 * @returns TMDB JSON body
 */
export default defineEventHandler(async (event): Promise<TmdbProxyResponse> => {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI

  if (!apiKey || typeof apiKey !== 'string') {
    throw createError({
      statusCode: 500,
      statusMessage: 'TMDB_API is not configured on the server',
    })
  }

  const segments = resolvePathSegments(event.context.params?.path)
  const incomingQuery = getQuery(event) as Record<string, unknown>
  const resourcePath = segments.join('/')
  const cacheKey = cacheKeyFromPathQuery(resourcePath, incomingQuery)
  const ttlMs = tmdbProxyTtlMs(segments)
  const ttlSec = Math.max(1, Math.floor(ttlMs / 1000))

  const cached = responseCache.get(cacheKey)
  if (cached !== undefined) {
    setHeader(event, 'X-Orbitra-Cache', 'HIT')
    setHeader(event, 'Cache-Control', `private, max-age=${ttlSec}`)
    return cached
  }

  const search = buildUpstreamSearch(incomingQuery, String(apiKey))
  const tmdbUrl = `${TMDB_API_BASE}/${resourcePath}?${search.toString()}`

  try {
    const body = await fetchAndCache(cacheKey, tmdbUrl, ttlMs)
    setHeader(event, 'X-Orbitra-Cache', 'MISS')
    setHeader(event, 'Cache-Control', `private, max-age=${ttlSec}`)
    return body
  } catch (err: unknown) {
    rethrowAsH3(err)
  }
})