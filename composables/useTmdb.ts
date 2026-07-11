/**
 * Client-safe TMDB access via Nitro proxy (`/api/tmdb/*`).
 * Never pass or store the TMDB API key in the browser.
 *
 * All network helpers reject with H3-style errors from the proxy (statusCode / statusMessage).
 * Callers should use `useLazyAsyncData` / try-catch and surface `statusMessage` in the UI.
 */

/** TMDB image size suffixes accepted by `imageUrl`. */
export type TmdbImageSize
  = | 'w185'
    | 'w300'
    | 'w500'
    | 'w780'
    | 'original'
    | 'w1920_and_h800_multi_faces'
    | 'w300_and_h300_bestv2'

/** Query bag forwarded to the Nitro proxy (serialized as URL params). */
export type TmdbQuery = Record<string, string | number | boolean | null | undefined>

/** Trending / discover / search list envelope. */
export interface TmdbPagedResult<T = TmdbMediaItem> {
  page?: number
  results?: T[]
  total_pages?: number
  total_results?: number
}

/** CSS style bag for detail/hero banners — omit backgroundImage when no art. */
/** Inline style bag compatible with Vue `style` bindings. */
export type BackdropStyle = Record<string, string>

/** Minimal fields shared by movie/TV cards in grids and rails. */
export interface TmdbMediaItem {
  id: number
  media_type?: 'movie' | 'tv' | 'person' | string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  profile_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  popularity?: number
  adult?: boolean
  character?: string
  credit_id?: string
}

/** Genre tag on detail payloads. */
export interface TmdbGenre {
  id: number
  name: string
}

/** Movie detail payload (subset used by Orbitra pages). */
export interface TmdbMovie extends TmdbMediaItem {
  title: string
  tagline?: string
  runtime?: number
  budget?: number
  revenue?: number
  status?: string
  imdb_id?: string
  genres?: TmdbGenre[]
  belongs_to_collection?: {
    id: number
    name: string
    poster_path?: string | null
    backdrop_path?: string | null
  } | null
}

/** TV show detail payload. */
export interface TmdbTvShow extends TmdbMediaItem {
  name: string
  tagline?: string
  status?: string
  genres?: TmdbGenre[]
  seasons?: TmdbSeasonSummary[]
  number_of_seasons?: number
  number_of_episodes?: number
  created_by?: Array<{ id: number, name: string, profile_path?: string | null }>
}

/** Season list entry on a show (not full season detail). */
export interface TmdbSeasonSummary {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  season_number: number
  episode_count?: number
  air_date?: string
  vote_average?: number
  vote_count?: number
}

/** Full season detail including episodes. */
export interface TmdbSeason extends TmdbSeasonSummary {
  episodes?: TmdbEpisode[]
}

/** Episode detail / list entry. */
export interface TmdbEpisode {
  id: number
  name: string
  overview?: string
  still_path?: string | null
  air_date?: string
  episode_number: number
  season_number?: number
  runtime?: number | null
  vote_average?: number
  vote_count?: number
  crew?: TmdbCastMember[]
  guest_stars?: TmdbCastMember[]
}

/** Person / actor detail. */
export interface TmdbPerson {
  id: number
  name: string
  biography?: string
  birthday?: string
  deathday?: string | null
  place_of_birth?: string
  profile_path?: string | null
  known_for_department?: string
  imdb_id?: string
  also_known_as?: string[]
  gender?: number
  popularity?: number
  homepage?: string | null
  adult?: boolean
}

/** Shared image asset fields from TMDB images endpoints. */
export interface TmdbImageAsset {
  file_path: string
  width?: number
  height?: number
  aspect_ratio?: number
  vote_average?: number
  vote_count?: number
  iso_639_1?: string | null
}

/** Person tagged / profile images. */
export interface TmdbPersonImages {
  id?: number
  profiles?: TmdbImageAsset[]
}

/** Movie / TV stills, posters, backdrops. */
export interface TmdbMediaImages {
  id?: number
  backdrops?: TmdbImageAsset[]
  posters?: TmdbImageAsset[]
  logos?: TmdbImageAsset[]
  stills?: TmdbImageAsset[]
}

/** Movie detail with optional append_to_response blobs. */
export type TmdbMovieDetailed = TmdbMovie & {
  credits?: TmdbCredits
  images?: TmdbMediaImages
  videos?: TmdbVideos
  recommendations?: TmdbPagedResult<TmdbMediaItem>
  similar?: TmdbPagedResult<TmdbMediaItem>
}

/** TV detail with optional append_to_response blobs. */
export type TmdbTvDetailed = TmdbTvShow & {
  credits?: TmdbCredits
  images?: TmdbMediaImages
  videos?: TmdbVideos
  recommendations?: TmdbPagedResult<TmdbMediaItem>
  similar?: TmdbPagedResult<TmdbMediaItem>
  external_ids?: TmdbExternalIds
}

/** Person detail with optional append_to_response blobs. */
export type TmdbPersonDetailed = TmdbPerson & {
  combined_credits?: TmdbCombinedCredits
  images?: TmdbPersonImages
  external_ids?: TmdbExternalIds
}

/** append_to_response bundles (watch/providers is not appendable). */
export const MOVIE_APPEND = 'credits,images,videos,recommendations,similar'
export const TV_APPEND = 'credits,images,videos,recommendations,similar,external_ids'
export const PERSON_APPEND = 'combined_credits,images,external_ids'

/** Cast / crew member on credits endpoints. */
export interface TmdbCastMember {
  id: number
  name?: string
  original_name?: string
  character?: string
  job?: string
  department?: string
  profile_path?: string | null
  popularity?: number
  order?: number
}

/** Credits envelope for movie/TV. */
export interface TmdbCredits {
  id?: number
  cast?: TmdbCastMember[]
  crew?: TmdbCastMember[]
}

/** Combined credits for a person (mixed movie/TV cast). */
export interface TmdbCombinedCredits {
  cast?: TmdbMediaItem[]
  crew?: TmdbMediaItem[]
}

/** Single streaming / rental / purchase outlet on a title. */
export interface TmdbWatchProvider {
  provider_id: number
  provider_name: string
  logo_path?: string | null
  display_priority?: number
}

/** Availability for one ISO country (JustWatch-backed). */
export interface TmdbWatchProviderRegion {
  link?: string
  flatrate?: TmdbWatchProvider[]
  free?: TmdbWatchProvider[]
  ads?: TmdbWatchProvider[]
  rent?: TmdbWatchProvider[]
  buy?: TmdbWatchProvider[]
}

/** Watch-provider results keyed by ISO country code. */
export interface TmdbWatchProviders {
  id?: number
  results?: Record<string, TmdbWatchProviderRegion>
}

/** Entry from `/watch/providers/movie` or `/watch/providers/tv`. */
export interface TmdbWatchProviderListItem {
  provider_id: number
  provider_name: string
  logo_path?: string | null
  display_priority?: number
}

export interface TmdbWatchProviderListResult {
  results?: TmdbWatchProviderListItem[]
}

/** Monetization types accepted by TMDB discover `with_watch_monetization_types`. */
export type TmdbWatchMonetization = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'

/** Options for discover movie/TV with optional provider filters. */
export interface DiscoverMediaOptions {
  'certification_country'?: string
  'certification.gte'?: string
  'certification.lte'?: string
  'certification'?: string
  'page'?: number
  'sort_by'?: string
  'vote_count.gte'?: number
  'vote_average.gte'?: number
  'with_genres'?: string
  /** Pipe-separated TMDB provider ids (OR within; AND with region). */
  'with_watch_providers'?: string
  /** ISO 3166-1 alpha-2 — required when filtering by providers. */
  'watch_region'?: string
  /** Pipe-separated: flatrate|free|ads|rent|buy */
  'with_watch_monetization_types'?: string
  'primary_release_year'?: number
  'first_air_date_year'?: number
}

/** Videos / trailers for a title. */
export interface TmdbVideos {
  id?: number
  results?: Array<{
    id: string
    key: string
    name: string
    site: string
    type: string
    official?: boolean
  }>
}

/** External IDs (IMDB, etc.). */
export interface TmdbExternalIds {
  imdb_id?: string | null
  facebook_id?: string | null
  instagram_id?: string | null
  twitter_id?: string | null
  id?: number
}

/** One movie in a TMDB collection (franchise part). */
export interface TmdbCollectionPart extends TmdbMediaItem {
  title?: string
  release_date?: string
  genre_ids?: number[]
  /** Watch / release order index (0-based) after {@link sortCollectionParts}. */
  watch_order?: number
}

/** Collection detail with parts. */
export interface TmdbCollection {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  parts?: TmdbCollectionPart[]
}

/** Row from GET /api/collections browse. */
export interface OrbitraCollectionBrowseItem {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  part_count: number
  part_ids: number[]
  genre_ids: number[]
  first_release_date?: string | null
  last_release_date?: string | null
}

/** Options for multi-search. */
export interface SearchMultiOptions {
  page?: number
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p' as const

/** Client-side GET TTL — de-dupes navigations / remounts within a session. */
const CLIENT_GET_TTL_MS = 5 * 60 * 1000
const CLIENT_CACHE_MAX = 200

interface ClientCacheEntry {
  expires: number
  data: unknown
}

/** Module-scoped so every `useTmdb()` call shares the same GET cache. */
const clientGetCache = new Map<string, ClientCacheEntry>()
/** Coalesce concurrent identical GETs into one network request. */
const clientInflight = new Map<string, Promise<unknown>>()

/**
 * Normalize / validate a TMDB resource path for the proxy URL.
 * Rejects empty paths and parent-directory segments.
 *
 * @param path - TMDB v3 path without leading slash (e.g. `movie/550`)
 * @returns Cleaned path segment string
 * @throws {Error} When the path is empty or contains `..`
 */
function normalizeTmdbPath(path: string): string {
  const clean = String(path || '')
    .replace(/^\/+/, '')
    .trim()
  if (!clean) {
    throw new Error('TMDB path is required')
  }
  const segments = clean.split('/').filter(Boolean)
  if (segments.some(s => s === '..' || s.includes('\\'))) {
    throw new Error('Invalid TMDB path')
  }
  return segments.join('/')
}

/**
 * Assert a positive numeric TMDB id (string or number).
 *
 * @param id - Title / person id
 * @param label - Field name for error messages
 * @returns Trimmed string form of the id
 * @throws {Error} When missing or non-positive
 */
function requireId(id: string | number, label = 'id'): string {
  if (id === null || id === undefined || id === '') {
    throw new Error(`TMDB ${label} is required`)
  }
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`TMDB ${label} must be a positive number`)
  }
  return String(id).trim()
}

/**
 * Assert a non-negative integer season number (0 = specials on TMDB).
 * Rejects path-like values (`1/credits`) that would smuggle extra segments.
 *
 * @param value - Season number from route params or callers
 * @param label - Field name for error messages
 * @returns Decimal string of the integer (no leading junk)
 * @throws {Error} When missing, non-integer, or negative
 */
function requireSeasonNum(value: string | number, label = 'season number'): string {
  if (value === null || value === undefined || value === '') {
    throw new Error(`TMDB ${label} is required`)
  }
  const raw = String(value).trim()
  // Digits only — blocks `/`, `\`, scientific notation, decimals, traversal
  if (!/^\d+$/.test(raw)) {
    throw new Error(`TMDB ${label} must be a non-negative integer`)
  }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`TMDB ${label} must be a non-negative integer`)
  }
  return String(n)
}

/**
 * Assert a positive integer episode number within a season.
 *
 * @param value - Episode number from route params or callers
 * @param label - Field name for error messages
 * @returns Decimal string of the integer
 * @throws {Error} When missing, non-integer, or less than 1
 */
function requireEpisodeNum(value: string | number, label = 'episode number'): string {
  if (value === null || value === undefined || value === '') {
    throw new Error(`TMDB ${label} is required`)
  }
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) {
    throw new Error(`TMDB ${label} must be a positive integer`)
  }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`TMDB ${label} must be a positive integer`)
  }
  return String(n)
}

/**
 * Stable client cache key for a GET (path + sorted query, no secrets).
 *
 * @param path - Normalized TMDB path
 * @param query - Safe query bag
 */
function clientCacheKey(path: string, query: TmdbQuery): string {
  const keys = Object.keys(query)
    .filter(k => k !== 'api_key' && query[k] !== undefined && query[k] !== null)
    .sort()
  if (!keys.length) return path
  const q = keys.map(k => `${k}=${String(query[k])}`).join('&')
  return `${path}?${q}`
}

function readClientCache<T>(key: string): T | undefined {
  const hit = clientGetCache.get(key)
  if (!hit) return undefined
  if (hit.expires <= Date.now()) {
    clientGetCache.delete(key)
    return undefined
  }
  return hit.data as T
}

function writeClientCache(key: string, data: unknown, ttlMs: number): void {
  if (ttlMs <= 0) return
  if (clientGetCache.size >= CLIENT_CACHE_MAX && !clientGetCache.has(key)) {
    const oldest = clientGetCache.keys().next().value
    if (oldest !== undefined) clientGetCache.delete(oldest)
  }
  clientGetCache.set(key, { expires: Date.now() + ttlMs, data })
}

/**
 * Composable returning typed TMDB helpers that call the Nitro proxy only.
 * Successful GETs are memoized in-process for {@link CLIENT_GET_TTL_MS} (5 minutes)
 * so remounts and back/forward navigation reuse data without re-hitting `/api/tmdb`.
 * (Server proxy may also cache — this layer is the browser/session de-dupe.)
 *
 * @returns Object with `tmdb`, image helpers, and resource-specific getters
 *
 * @example
 * ```ts
 * const { getMovie, imageUrl } = useTmdb()
 * const movie = await getMovie(550)
 * ```
 */
export function useTmdb() {
  const apiBase = '/api/tmdb' as const

  /**
   * Build an absolute proxy URL for a TMDB resource path.
   *
   * @param path - TMDB v3 path (with or without leading slash)
   * @returns Browser URL under `/api/tmdb/...`
   */
  function pathUrl(path: string): string {
    return `${apiBase}/${normalizeTmdbPath(path)}`
  }

  /**
   * GET a TMDB v3 resource through the server proxy (cached 5 minutes client-side).
   * Errors from the proxy are rethrown as-is (typically H3 `createError` payloads).
   * Failed responses are never cached.
   *
   * @typeParam T - Expected JSON response shape
   * @param path - TMDB path relative to `/3/`
   * @param query - Optional query parameters (api_key is never accepted client-side)
   * @returns Parsed JSON body of type `T`
   */
  async function tmdb<T = unknown>(
    path: string,
    query: TmdbQuery = {},
  ): Promise<T> {
    const safePath = normalizeTmdbPath(path)
    // Strip client attempts to pass a key or include_adult; server owns TMDB_API and always forces include_adult=false
    const {
      api_key: _ignoredKey,
      include_adult: _ignoredAdult,
      ...safeQuery
    } = query as TmdbQuery & { api_key?: unknown, include_adult?: unknown }
    void _ignoredKey
    void _ignoredAdult

    const key = clientCacheKey(safePath, safeQuery)
    const cached = readClientCache<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const pendingExisting = clientInflight.get(key) as Promise<T> | undefined
    if (pendingExisting) {
      return pendingExisting
    }

    const pending = (async (): Promise<T> => {
      try {
        const body = (await $fetch(pathUrl(safePath), {
          query: safeQuery,
        })) as T
        writeClientCache(key, body, CLIENT_GET_TTL_MS)
        return body
      }
      catch (err: unknown) {
        if (err && typeof err === 'object' && ('statusCode' in err || 'statusMessage' in err)) {
          throw err
        }
        const message
          = err instanceof Error ? err.message : 'TMDB request failed'
        throw createError({
          statusCode: 502,
          statusMessage: message,
        })
      }
      finally {
        clientInflight.delete(key)
      }
    })()

    clientInflight.set(key, pending)
    return pending
  }

  /**
   * Build a full TMDB image CDN URL, or empty string when `filePath` is missing.
   *
   * @param filePath - Path from TMDB (`/abc.jpg`) or nullish
   * @param size - Image width / variant token
   * @returns Absolute `image.tmdb.org` URL or `''`
   */
  function imageUrl(
    filePath: string | null | undefined,
    size: TmdbImageSize = 'w500',
  ): string {
    if (filePath == null) return ''
    const raw = String(filePath).trim()
    if (!raw || raw === 'null' || raw === 'undefined') return ''
    const file = raw.startsWith('/') ? raw.slice(1) : raw
    if (!file || file.includes('..') || file.includes('//')) return ''
    return `${IMAGE_BASE}/${size}/${file}`
  }

  /**
   * Inline style object for CSS `background-image` on banners.
   * Never emits `url(undefined)` / `url()` — missing paths yield no background-image
   * so `.media-banner` solid fallback shows through.
   *
   * @param filePath - Backdrop (or poster) path from TMDB
   * @param fallbackPath - Optional second path (e.g. poster) when backdrop is missing
   * @returns Style bag; omit `backgroundImage` when no usable URL
   */
  function backdropStyle(
    filePath: string | null | undefined,
    fallbackPath?: string | null,
  ): BackdropStyle {
    const url
      = imageUrl(filePath, 'w1920_and_h800_multi_faces')
        || imageUrl(fallbackPath, 'w1920_and_h800_multi_faces')
        || imageUrl(fallbackPath, 'w780')
    if (!url) return {}
    return { backgroundImage: `url("${url}")` }
  }

  /**
   * Trending titles for a media class and time window.
   *
   * @param media - `all` | `movie` | `tv`
   * @param timeWindow - `day` | `week`
   * @param page - 1-based page index
   */
  function getTrending(
    media: 'all' | 'movie' | 'tv' = 'all',
    timeWindow: 'day' | 'week' = 'week',
    page = 1,
  ): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>(`trending/${media}/${timeWindow}`, { page })
  }

  /**
   * Movies currently in theatres (region depends on TMDB defaults).
   *
   * @param page - 1-based page index
   */
  function getNowPlaying(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('movie/now_playing', { page })
  }

  /** Movie + credits/images/videos/recs/similar in one TMDB request. */
  function getMovieDetailed(id: string | number): Promise<TmdbMovieDetailed> {
    return tmdb<TmdbMovieDetailed>(`movie/${requireId(id)}`, {
      append_to_response: MOVIE_APPEND,
    })
  }

  /**
   * Official genre catalogue for movie or TV discover filters.
   * @param media - `movie` or `tv`
   */
  function getGenreList(
    media: 'movie' | 'tv',
  ): Promise<{ genres: TmdbGenre[] }> {
    return tmdb<{ genres: TmdbGenre[] }>(`genre/${media}/list`)
  }

  /** JustWatch-backed provider list for a movie (all regions; filter client-side by country). */
  function getMovieProviders(id: string | number): Promise<TmdbWatchProviders> {
    return tmdb<TmdbWatchProviders>(`movie/${requireId(id)}/watch/providers`)
  }

  /** JustWatch-backed provider list for a TV show. */
  function getTvProviders(id: string | number): Promise<TmdbWatchProviders> {
    return tmdb<TmdbWatchProviders>(`tv/${requireId(id)}/watch/providers`)
  }

  /** Tag list rows with media_type for poster cards / links. */
  function withMediaType(
    items: TmdbMediaItem[] | undefined | null,
    mediaType: 'movie' | 'tv',
  ): TmdbMediaItem[] {
    return (items || []).map(it => ({
      ...it,
      media_type: it.media_type || mediaType,
    }))
  }

  /** Movies on the TMDB upcoming calendar. */
  function getUpcomingMovies(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('movie/upcoming', { page })
  }

  /**
   * Providers available for a title in one region (stream / rent / buy / free / ads).
   * Returns null when TMDB has no data for that country.
   */
  function regionProviders(
    payload: TmdbWatchProviders | null | undefined,
    region: string,
  ): TmdbWatchProviderRegion | null {
    const code = String(region || '').trim().toUpperCase()
    if (!code || !payload?.results) return null
    return payload.results[code] || null
  }

  /** True when the title has at least one flatrate (subscription) outlet in the region. */
  function hasStreamingInRegion(
    payload: TmdbWatchProviders | null | undefined,
    region: string,
  ): boolean {
    const r = regionProviders(payload, region)
    return !!(r?.flatrate && r.flatrate.length > 0)
  }

  /**
   * Catalogue of providers that serve a region (for discover chips / filters).
   * TMDB requires `watch_region` for meaningful results.
   *
   * @param media - `movie` or `tv` (catalogues can differ slightly)
   * @param watchRegion - ISO country code
   */
  function getWatchProviderList(
    media: 'movie' | 'tv',
    watchRegion: string,
  ): Promise<TmdbWatchProviderListResult> {
    const region = String(watchRegion || '').trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(region)) {
      throw new Error('watch_region must be a 2-letter country code')
    }
    return tmdb<TmdbWatchProviderListResult>(`watch/providers/${media}`, {
      watch_region: region,
    })
  }

  /**
   * Run async work over items with limited concurrency (provider checks, etc.).
   */
  async function mapPoolLimited<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const out: R[] = new Array(items.length)
    let next = 0
    async function worker() {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    }
    const n = Math.min(limit, Math.max(1, items.length))
    await Promise.all(Array.from({ length: n }, () => worker()))
    return out
  }

  /**
   * Keep only movie/TV multi-search hits that have subscription (flatrate) availability
   * in the given region. People rows are dropped when filtering for streaming.
   */
  async function filterStreamingOnly(
    items: TmdbMediaItem[],
    region: string,
  ): Promise<TmdbMediaItem[]> {
    const code = String(region || '').trim().toUpperCase()
    if (!code) return items

    const candidates = items.filter((it) => {
      const mt = it.media_type
      return mt === 'movie' || mt === 'tv' || (!mt && (it.title || it.name))
    })

    const flags = await mapPoolLimited(candidates, 4, async (it) => {
      const mt
        = it.media_type === 'tv' || (!it.media_type && it.name && !it.title)
          ? 'tv'
          : 'movie'
      try {
        const providers
          = mt === 'tv'
            ? await getTvProviders(it.id)
            : await getMovieProviders(it.id)
        return hasStreamingInRegion(providers, code)
      }
      catch {
        return false
      }
    })

    const keep = new Set<number>()
    candidates.forEach((it, i) => {
      if (flags[i]) keep.add(it.id)
    })
    return items.filter((it) => {
      const mt = it.media_type
      if (mt === 'person') return false
      return keep.has(it.id)
    })
  }

  /**
   * TV show detail by id.
   * @param id - TMDB TV id
   * @param extras - Extra query params
   */
  function getTv(
    id: string | number,
    extras: TmdbQuery = {},
  ): Promise<TmdbTvShow> {
    return tmdb<TmdbTvShow>(`tv/${requireId(id)}`, extras)
  }

  /** TV + credits/images/videos/recs/similar/external_ids in one request. */
  function getTvDetailed(id: string | number): Promise<TmdbTvDetailed> {
    return tmdb<TmdbTvDetailed>(`tv/${requireId(id)}`, {
      append_to_response: TV_APPEND,
    })
  }

  /** Shows with recent / upcoming episodes (TMDB on_the_air). */
  function getOnTheAir(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('tv/on_the_air', { page })
  }

  /** TV episodes airing today (region follows TMDB defaults). */
  function getAiringToday(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('tv/airing_today', { page })
  }

  /** Cast & crew for a TV show. */
  function getTvCredits(id: string | number): Promise<TmdbCredits> {
    return tmdb<TmdbCredits>(`tv/${requireId(id)}/credits`)
  }

  /**
   * Pick the best YouTube trailer (or first YouTube video) from a videos blob.
   * Prefers official Trailers, then Teasers, then any YouTube result.
   */
  function pickTrailer(
    videos: TmdbVideos | null | undefined,
  ): { key: string, name: string, type: string } | null {
    const list = (videos?.results || []).filter(
      v => v?.site === 'YouTube' && v?.key,
    )
    if (!list.length) return null
    const rank = (v: { type?: string, official?: boolean }) => {
      let score = 0
      if (v.type === 'Trailer') score += 40
      else if (v.type === 'Teaser') score += 20
      else if (v.type === 'Clip') score += 10
      if (v.official) score += 5
      return score
    }
    const sorted = list.slice().sort((a, b) => rank(b) - rank(a))
    const best = sorted[0]
    return { key: best.key, name: best.name, type: best.type }
  }

  /** YouTube embed URL for a trailer key (privacy-enhanced host). */
  function youtubeEmbedUrl(key: string): string {
    const k = String(key || '').trim()
    if (!k || !/^[\w-]{6,}$/.test(k)) return ''
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(k)}`
  }

  /**
   * Season detail including episodes.
   *
   * @param tvId - Parent show id
   * @param seasonNum - Season number (0 = specials on TMDB)
   */
  function getTvSeason(
    tvId: string | number,
    seasonNum: string | number,
  ): Promise<TmdbSeason> {
    return tmdb<TmdbSeason>(
      `tv/${requireId(tvId, 'tv id')}/season/${requireSeasonNum(seasonNum)}`,
    )
  }

  /**
   * Cast/crew for a single season (prefer over ad-hoc `tmdb('tv/.../season/.../credits')`).
   *
   * @param tvId - Parent show id
   * @param seasonNum - Season number
   */
  function getTvSeasonCredits(
    tvId: string | number,
    seasonNum: string | number,
  ): Promise<TmdbCredits> {
    return tmdb<TmdbCredits>(
      `tv/${requireId(tvId, 'tv id')}/season/${requireSeasonNum(seasonNum)}/credits`,
    )
  }

  /**
   * Single episode detail.
   *
   * @param tvId - Parent show id
   * @param seasonNum - Season number
   * @param episodeNum - Episode number within the season
   */
  function getTvEpisode(
    tvId: string | number,
    seasonNum: string | number,
    episodeNum: string | number,
  ): Promise<TmdbEpisode> {
    return tmdb<TmdbEpisode>(
      `tv/${requireId(tvId, 'tv id')}/season/${requireSeasonNum(seasonNum)}/episode/${requireEpisodeNum(episodeNum)}`,
    )
  }

  /** Person + combined_credits, images, external_ids in one request. */
  function getPersonDetailed(id: string | number): Promise<TmdbPersonDetailed> {
    return tmdb<TmdbPersonDetailed>(`person/${requireId(id)}`, {
      append_to_response: PERSON_APPEND,
    })
  }

  /**
   * OpenStreetMap search URL for a birthplace string (no API key; opens in new tab).
   */
  function birthplaceMapUrl(place: string | null | undefined): string {
    const q = String(place || '').trim()
    if (!q) return ''
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`
  }

  /** Social / IMDb links from person external_ids (+ optional homepage on person). */
  function personExternalLinks(
    ids: TmdbExternalIds | null | undefined,
    homepage?: string | null,
  ): Array<{ id: string, label: string, href: string }> {
    const out: Array<{ id: string, label: string, href: string }> = []
    if (ids?.imdb_id) {
      out.push({
        id: 'imdb',
        label: 'IMDb',
        href: `https://www.imdb.com/name/${ids.imdb_id}/`,
      })
    }
    if (ids?.instagram_id) {
      out.push({
        id: 'instagram',
        label: 'Instagram',
        href: `https://www.instagram.com/${ids.instagram_id}/`,
      })
    }
    if (ids?.twitter_id) {
      out.push({
        id: 'twitter',
        label: 'X / Twitter',
        href: `https://twitter.com/${ids.twitter_id}`,
      })
    }
    if (ids?.facebook_id) {
      out.push({
        id: 'facebook',
        label: 'Facebook',
        href: `https://www.facebook.com/${ids.facebook_id}`,
      })
    }
    const home = homepage && String(homepage).trim()
    if (home && /^https?:\/\//i.test(home)) {
      out.push({ id: 'homepage', label: 'Website', href: home })
    }
    return out
  }

  /** Movie collection (franchise) detail — parts are TMDB membership; order by release_date. */
  function getCollection(id: string | number): Promise<TmdbCollection> {
    return tmdb<TmdbCollection>(`collection/${requireId(id)}`)
  }

  /**
   * Sort collection parts into watch / release order (release_date asc, then id).
   * Unreleased or undated titles sort last.
   */
  function sortCollectionParts(parts: TmdbCollectionPart[] | undefined | null): TmdbCollectionPart[] {
    const list = (parts || []).slice()
    list.sort((a, b) => {
      const da = a.release_date || '9999-99-99'
      const db = b.release_date || '9999-99-99'
      if (da !== db) return da < db ? -1 : 1
      return (a.id || 0) - (b.id || 0)
    })
    return list.map((p, i) => ({ ...p, watch_order: i + 1 }))
  }

  /** Search TMDB collections by name. */
  function searchCollections(
    query: string,
    page = 1,
  ): Promise<TmdbPagedResult<TmdbCollection>> {
    const q = String(query || '').trim()
    if (!q) throw new Error('Search query is required')
    return tmdb<TmdbPagedResult<TmdbCollection>>('search/collection', {
      query: q,
      page,
    })
  }

  /**
   * Orbitra curated collection browse (server builds part_ids + genres from TMDB).
   */
  async function browseCollections(opts: {
    genre?: number | null
    q?: string
    minParts?: number
    maxParts?: number
  } = {}): Promise<{
    results: OrbitraCollectionBrowseItem[]
    total: number
    catalog_size?: number
  }> {
    const query: Record<string, string | number> = {}
    if (opts.genre != null && opts.genre > 0) query.genre = opts.genre
    if (opts.q) query.q = opts.q
    if (opts.minParts != null) query.minParts = opts.minParts
    if (opts.maxParts != null) query.maxParts = opts.maxParts
    return $fetch('/api/collections', { query })
  }

  /**
   * Resolve membership: prefer movie.belongs_to_collection.id, else null.
   * Full part list always comes from getCollection(collectionId).
   */
  function collectionIdFromMovie(
    movie: { belongs_to_collection?: { id?: number } | null } | null | undefined,
  ): number | null {
    const id = movie?.belongs_to_collection?.id
    if (id == null) return null
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  /**
   * Multi-search across movies, TV, and people.
   *
   * @param query - Search string (caller should ensure length > 2 typically)
   * @param opts - Pagination only (`include_adult` is always false on the server)
   * @throws {Error} When `query` is empty/whitespace
   */
  function searchMulti(
    query: string,
    opts: SearchMultiOptions = {},
  ): Promise<TmdbPagedResult<TmdbMediaItem>> {
    const q = String(query || '').trim()
    if (!q) {
      throw new Error('Search query is required')
    }
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('search/multi', {
      query: q,
      page: opts.page ?? 1,
    })
  }

  /** Top-rated movies list. */
  function getTopRatedMovies(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('movie/top_rated', { page })
  }

  /** Top-rated TV list. */
  function getTopRatedTv(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('tv/top_rated', { page })
  }

  /**
   * Build discover query bag from options (shared by movie / TV).
   */
  function buildDiscoverQuery(
    opts: DiscoverMediaOptions,
    defaults: { sort_by: string, voteCountGte: number },
  ): TmdbQuery {
    const page = Math.max(1, opts.page ?? 1)
    const q: TmdbQuery = {
      sort_by: opts.sort_by ?? defaults.sort_by,
      page,
    }
    const voteGte = opts['vote_count.gte']
    if (voteGte != null) {
      q['vote_count.gte'] = voteGte
    }
    else if (opts.with_watch_providers || opts.with_watch_monetization_types) {
      q['vote_count.gte'] = 50
    }
    else {
      q['vote_count.gte'] = defaults.voteCountGte
    }
    if (opts['vote_average.gte'] != null) q['vote_average.gte'] = opts['vote_average.gte']
    if (opts.with_genres) q.with_genres = opts.with_genres
    if (opts.certification_country) q.certification_country = opts.certification_country
    if (opts['certification.gte']) q['certification.gte'] = opts['certification.gte']
    if (opts['certification.lte']) q['certification.lte'] = opts['certification.lte']
    if (opts.certification) q.certification = opts.certification
    if (opts.with_watch_providers) q.with_watch_providers = opts.with_watch_providers
    if (opts.watch_region) q.watch_region = String(opts.watch_region).toUpperCase()
    if (opts.with_watch_monetization_types) {
      q.with_watch_monetization_types = opts.with_watch_monetization_types
    }
    if (opts.primary_release_year != null) q.primary_release_year = opts.primary_release_year
    if (opts.first_air_date_year != null) q.first_air_date_year = opts.first_air_date_year
    return q
  }

  /**
   * Discover movies (home rails + provider-filtered browse).
   * Pass a number for legacy `discoverMovies(1)` or an options object.
   */
  function discoverMovies(
    pageOrOpts: number | DiscoverMediaOptions = 1,
  ): Promise<TmdbPagedResult<TmdbMediaItem>> {
    const opts: DiscoverMediaOptions
      = typeof pageOrOpts === 'number' ? { page: pageOrOpts } : pageOrOpts || {}
    return tmdb<TmdbPagedResult<TmdbMediaItem>>(
      'discover/movie',
      buildDiscoverQuery(opts, { sort_by: 'popularity.desc', voteCountGte: 250 }),
    )
  }

  /**
   * Discover TV (home rails + provider-filtered browse).
   */
  function discoverTv(
    pageOrOpts: number | DiscoverMediaOptions = 1,
  ): Promise<TmdbPagedResult<TmdbMediaItem>> {
    const opts: DiscoverMediaOptions
      = typeof pageOrOpts === 'number' ? { page: pageOrOpts } : pageOrOpts || {}
    return tmdb<TmdbPagedResult<TmdbMediaItem>>(
      'discover/tv',
      buildDiscoverQuery(opts, { sort_by: 'popularity.desc', voteCountGte: 250 }),
    )
  }

  /**
   * Public client API — only helpers used by pages/components (see knip).
   * Prefer *Detailed + append_to_response; providers stay separate (not appendable).
   */
  return {
    imageUrl,
    backdropStyle,
    getTrending,
    getNowPlaying,
    getMovieDetailed,
    getMovieProviders,
    getUpcomingMovies,
    getTvProviders,
    withMediaType,
    getWatchProviderList,
    regionProviders,
    hasStreamingInRegion,
    filterStreamingOnly,
    getGenreList,
    pickTrailer,
    youtubeEmbedUrl,
    getTv,
    getTvDetailed,
    getTvCredits,
    getOnTheAir,
    getAiringToday,
    getTvSeason,
    getTvSeasonCredits,
    getTvEpisode,
    getPersonDetailed,
    birthplaceMapUrl,
    personExternalLinks,
    getCollection,
    sortCollectionParts,
    searchCollections,
    browseCollections,
    collectionIdFromMovie,
    searchMulti,
    getTopRatedMovies,
    getTopRatedTv,
    discoverMovies,
    discoverTv,
  } as const
}

/** Return type of {@link useTmdb} for explicit annotations in callers. */
export type UseTmdbReturn = ReturnType<typeof useTmdb>
