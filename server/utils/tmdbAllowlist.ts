/**
 * TMDB paths the public proxy (`/api/tmdb/**`) is allowed to forward.
 *
 * Only the resources Orbitra's UI actually requests are listed, so the demo cannot be used
 * as a free general-purpose TMDB API (every forwarded call costs a function invocation and
 * spends the server's TMDB quota). Add a pattern here when the app starts using a new
 * endpoint.
 *
 * @module server/utils/tmdbAllowlist
 */

const ID = '\\d{1,9}'
const SMALL = '\\d{1,4}'

const ALLOWED_PATTERNS: RegExp[] = [
  // Feeds and charts
  /^trending\/(all|movie|tv|person)\/(day|week)$/,
  /^(movie|tv)\/(now_playing|upcoming|popular|top_rated|on_the_air|airing_today)$/,
  /^discover\/(movie|tv)$/,
  /^search\/(multi|movie|tv|person)$/,
  /^genre\/(movie|tv)\/list$/,
  /^watch\/providers\/(movie|tv)$/,

  // Detail payloads (+ sub-resources)
  new RegExp(`^(movie|tv)/${ID}$`),
  new RegExp(`^(movie|tv)/${ID}/(credits|aggregate_credits|watch/providers|videos|images|external_ids|recommendations|similar)$`),
  new RegExp(`^tv/${ID}/season/${SMALL}(/credits)?$`),
  new RegExp(`^tv/${ID}/season/${SMALL}/episode/${SMALL}$`),
  new RegExp(`^person/${ID}(/(combined_credits|images|external_ids))?$`),
  new RegExp(`^collection/${ID}$`),
]

/**
 * Whether a normalized TMDB resource path (no leading slash, no query) may be proxied.
 *
 * @param resourcePath - e.g. `movie/550` or `tv/1399/season/1`
 */
export function isAllowedTmdbPath(resourcePath: string): boolean {
  return ALLOWED_PATTERNS.some(re => re.test(resourcePath))
}

/** TMDB never returns more than 500 pages; anything above is a crawler walking the API. */
export const TMDB_MAX_PAGE = 500
