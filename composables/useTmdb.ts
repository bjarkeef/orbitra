/**
 * Client-safe TMDB access via Nitro proxy (`/api/tmdb/*`).
 * Never pass or store the TMDB API key in the browser.
 *
 * All network helpers reject with H3-style errors from the proxy (statusCode / statusMessage).
 * Callers should use `useLazyAsyncData` / try-catch and surface `statusMessage` in the UI.
 */

/** TMDB image size suffixes accepted by `imageUrl`. */
export type TmdbImageSize =
  | 'w185'
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
  created_by?: Array<{ id: number; name: string; profile_path?: string | null }>
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
}

/** Full season detail including episodes. */
export interface TmdbSeason extends TmdbSeasonSummary {
  episodes?: TmdbEpisode[]
  vote_average?: number
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
}

/** Person / actor detail. */
export interface TmdbPerson {
  id: number
  name: string
  biography?: string
  birthday?: string
  place_of_birth?: string
  profile_path?: string | null
  known_for_department?: string
  imdb_id?: string
}

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

/** Watch-provider results keyed by ISO country code. */
export interface TmdbWatchProviders {
  id?: number
  results?: Record<
    string,
    {
      link?: string
      flatrate?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>
      buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>
      rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>
    }
  >
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

/** Collection detail with parts. */
export interface TmdbCollection {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  parts?: TmdbMediaItem[]
}

/** CSS background style for hero / detail banners. */
export interface BackdropStyle {
  backgroundImage: string
}

/** Options for multi-search. */
export interface SearchMultiOptions {
  page?: number
  include_adult?: boolean
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
 * Bumped on {@link clearTmdbClientCache} so in-flight GETs cannot repopulate
 * the cache after an intentional wipe (logout / forced refresh).
 */
let clientCacheGeneration = 0

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
  if (segments.some((s) => s === '..' || s.includes('\\'))) {
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
    .filter((k) => k !== 'api_key' && query[k] !== undefined && query[k] !== null)
    .sort()
  if (!keys.length) return path
  const q = keys.map((k) => `${k}=${String(query[k])}`).join('&')
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
 * Drop all client-side GET entries (useful after logout / forced refresh).
 * In-flight requests started before this call will not write into the new generation.
 */
export function clearTmdbClientCache(): void {
  clientCacheGeneration += 1
  clientGetCache.clear()
  clientInflight.clear()
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
    // Strip client attempts to pass a key or include_adult; server owns TMDB_API + adult gate
    const {
      api_key: _ignoredKey,
      include_adult: _ignoredAdult,
      ...restQuery
    } = query as TmdbQuery & { api_key?: unknown; include_adult?: unknown }
    void _ignoredKey
    void _ignoredAdult

    const { isAdultEnabled, filterAdultPaged, filterAdultResults, ADULT_INCLUDE_HEADER } =
      useAdultContent()

    // Segment client cache by adult preference so toggling does not serve stale lists
    const safeQuery: TmdbQuery = {
      ...restQuery,
      _orbitra_adult: isAdultEnabled.value ? '1' : '0',
    }

    const key = clientCacheKey(safePath, safeQuery)
    const cached = readClientCache<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const pendingExisting = clientInflight.get(key) as Promise<T> | undefined
    if (pendingExisting) {
      return pendingExisting
    }

    // Query sent to proxy never includes include_adult or our internal cache segment key
    const { _orbitra_adult: _seg, ...proxyQuery } = safeQuery
    void _seg

    const headers: Record<string, string> = {}
    if (isAdultEnabled.value) {
      headers[ADULT_INCLUDE_HEADER] = '1'
    }

    const generationAtStart = clientCacheGeneration
    const pending = (async (): Promise<T> => {
      try {
        let body = await $fetch<T>(pathUrl(safePath), {
          query: proxyQuery,
          headers,
        })
        // When adult is off, strip adult-flagged rows before they hit UI / client cache
        if (!isAdultEnabled.value && body && typeof body === 'object') {
          const b = body as { results?: Array<{ adult?: boolean }> }
          if (Array.isArray(b.results)) {
            body = filterAdultPaged(b as { results?: Array<{ adult?: boolean }> }) as T
          } else if (Array.isArray(body)) {
            body = filterAdultResults(body as Array<{ adult?: boolean }>) as T
          }
        }
        if (generationAtStart === clientCacheGeneration) {
          writeClientCache(key, body, CLIENT_GET_TTL_MS)
        }
        return body
      } catch (err: unknown) {
        if (err && typeof err === 'object' && ('statusCode' in err || 'statusMessage' in err)) {
          throw err
        }
        const message =
          err instanceof Error ? err.message : 'TMDB request failed'
        throw createError({
          statusCode: 502,
          statusMessage: message,
        })
      } finally {
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
    if (!filePath) return ''
    const file = filePath.startsWith('/') ? filePath.slice(1) : filePath
    if (!file || file.includes('..')) return ''
    return `${IMAGE_BASE}/${size}/${file}`
  }

  /**
   * Inline style object for CSS `background-image` on banners.
   *
   * @param filePath - Backdrop path from TMDB
   * @returns `{ backgroundImage: 'url(...)' }` or empty url string
   */
  function backdropStyle(filePath: string | null | undefined): BackdropStyle {
    const url = imageUrl(filePath, 'w1920_and_h800_multi_faces')
    return { backgroundImage: url ? `url(${url})` : '' }
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

  /**
   * Movie detail by id.
   *
   * @param id - TMDB movie id
   * @param extras - Extra query params (e.g. `append_to_response`)
   */
  function getMovie(
    id: string | number,
    extras: TmdbQuery = {},
  ): Promise<TmdbMovie> {
    return tmdb<TmdbMovie>(`movie/${requireId(id)}`, extras)
  }

  /** Cast & crew for a movie. */
  function getMovieCredits(id: string | number): Promise<TmdbCredits> {
    return tmdb<TmdbCredits>(`movie/${requireId(id)}/credits`)
  }

  /** JustWatch-backed provider list for a movie. */
  function getMovieProviders(id: string | number): Promise<TmdbWatchProviders> {
    return tmdb<TmdbWatchProviders>(`movie/${requireId(id)}/watch/providers`)
  }

  /** Trailers and other videos for a movie. */
  function getMovieVideos(id: string | number): Promise<TmdbVideos> {
    return tmdb<TmdbVideos>(`movie/${requireId(id)}/videos`)
  }

  /**
   * TV show detail by id.
   *
   * @param id - TMDB TV id
   * @param extras - Extra query params
   */
  function getTv(
    id: string | number,
    extras: TmdbQuery = {},
  ): Promise<TmdbTvShow> {
    return tmdb<TmdbTvShow>(`tv/${requireId(id)}`, extras)
  }

  /** Cast & crew for a TV show. */
  function getTvCredits(id: string | number): Promise<TmdbCredits> {
    return tmdb<TmdbCredits>(`tv/${requireId(id)}/credits`)
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

  /** Person / actor profile. */
  function getPerson(id: string | number): Promise<TmdbPerson> {
    return tmdb<TmdbPerson>(`person/${requireId(id)}`)
  }

  /** Mixed movie/TV credits for a person (filmography). */
  function getPersonCombinedCredits(id: string | number): Promise<TmdbCombinedCredits> {
    return tmdb<TmdbCombinedCredits>(`person/${requireId(id)}/combined_credits`)
  }

  /** Movie collection (franchise) detail. */
  function getCollection(id: string | number): Promise<TmdbCollection> {
    return tmdb<TmdbCollection>(`collection/${requireId(id)}`)
  }

  /**
   * Multi-search across movies, TV, and people.
   *
   * @param query - Search string (caller should ensure length > 2 typically)
   * @param opts - Pagination and adult flag
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
    // include_adult is controlled by X-Orbitra-Include-Adult via useAdultContent — not query
    void opts.include_adult
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

  /** Popular movies list. */
  function getPopularMovies(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('movie/popular', { page })
  }

  /**
   * Discover movies sorted by popularity with a minimum vote gate (Orbitra home rails).
   *
   * @param page - 1-based page index
   */
  function discoverMovies(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('discover/movie', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 250,
      page,
    })
  }

  /**
   * Discover TV sorted by popularity with a minimum vote gate.
   *
   * @param page - 1-based page index
   */
  function discoverTv(page = 1): Promise<TmdbPagedResult<TmdbMediaItem>> {
    return tmdb<TmdbPagedResult<TmdbMediaItem>>('discover/tv', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 250,
      page,
    })
  }

  /**
   * Discover titles for the adult explore page (requires adult preference + age gate).
   * Genre / sort / vote filters are passed through; include_adult is header-only.
   */
  function discoverAdultMedia(
    media: 'movie' | 'tv',
    opts: {
      page?: number
      sort_by?: string
      'vote_average.gte'?: number
      'vote_count.gte'?: number
      with_genres?: string
      without_genres?: string
      primary_release_year?: number
      first_air_date_year?: number
    } = {},
  ): Promise<TmdbPagedResult<TmdbMediaItem>> {
    const page = opts.page ?? 1
    const sort_by = opts.sort_by ?? 'popularity.desc'
    const query: TmdbQuery = {
      page,
      sort_by,
      'vote_count.gte': opts['vote_count.gte'] ?? 20,
    }
    if (opts['vote_average.gte'] != null) query['vote_average.gte'] = opts['vote_average.gte']
    if (opts.with_genres) query.with_genres = opts.with_genres
    if (opts.without_genres) query.without_genres = opts.without_genres
    if (media === 'movie' && opts.primary_release_year != null) {
      query.primary_release_year = opts.primary_release_year
    }
    if (media === 'tv' && opts.first_air_date_year != null) {
      query.first_air_date_year = opts.first_air_date_year
    }
    return tmdb<TmdbPagedResult<TmdbMediaItem>>(`discover/${media}`, query)
  }
  /** External ids for a TV show (IMDB link on Information panel). */
  function getTvExternalIds(id: string | number): Promise<TmdbExternalIds> {
    return tmdb<TmdbExternalIds>(`tv/${requireId(id)}/external_ids`)
  }

  /**
   * Credits for either a movie or TV title (orbit graph / shared helpers).
   *
   * @param mediaType - `movie` or `tv`
   * @param id - TMDB title id
   */
  function getCreditsForTitle(
    mediaType: 'movie' | 'tv',
    id: string | number,
  ): Promise<TmdbCredits> {
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      throw new Error('mediaType must be "movie" or "tv"')
    }
    return tmdb<TmdbCredits>(`${mediaType}/${requireId(id)}/credits`)
  }

  return {
    apiBase,
    pathUrl,
    tmdb,
    imageUrl,
    backdropStyle,
    getTrending,
    getNowPlaying,
    getMovie,
    getMovieCredits,
    getMovieProviders,
    getMovieVideos,
    getTv,
    getTvCredits,
    getTvSeason,
    getTvSeasonCredits,
    getTvEpisode,
    getPerson,
    getPersonCombinedCredits,
    getCollection,
    searchMulti,
    getTopRatedMovies,
    getTopRatedTv,
    getPopularMovies,
    discoverMovies,
    discoverTv,
    discoverAdultMedia,
    getTvExternalIds,
    getCreditsForTitle,
    /** Same as {@link clearTmdbClientCache} — exposed on the composable for convenience. */
    clearClientCache: clearTmdbClientCache,
  } as const
}

/** Return type of {@link useTmdb} for explicit annotations in callers. */
export type UseTmdbReturn = ReturnType<typeof useTmdb>