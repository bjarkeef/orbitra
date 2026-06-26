/**
 * Local movie ratings / "seen" markers for collection progress.
 * No Orbitra account yet — stored in a cookie (JSON map) so SSR and client agree.
 *
 * Rating scale: 1–10 (TMDB-style). Presence of a rating implies the user has seen it.
 * Optional `seen` without a score is not used; use rateMovie or clearRating only.
 *
 * @module composables/useMovieRatings
 */

const COOKIE_NAME = 'orbitra_movie_ratings'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 years

/** Per-movie entry: score 1–10, ISO timestamp when set. */
export interface MovieRatingEntry {
  score: number
  updatedAt: string
}

export type MovieRatingsMap = Record<string, MovieRatingEntry>

function clampScore(n: number): number | null {
  if (!Number.isFinite(n)) return null
  const s = Math.round(n)
  if (s < 1 || s > 10) return null
  return s
}

function movieKey(id: string | number): string {
  return String(id)
}

/**
 * Parse cookie / stored JSON into a ratings map (invalid entries dropped).
 */
export function parseRatingsMap(raw: unknown): MovieRatingsMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: MovieRatingsMap = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d+$/.test(k)) continue
    if (!v || typeof v !== 'object') continue
    const score = clampScore(Number((v as MovieRatingEntry).score))
    if (score == null) continue
    const updatedAt =
      typeof (v as MovieRatingEntry).updatedAt === 'string'
        ? (v as MovieRatingEntry).updatedAt
        : new Date().toISOString()
    out[k] = { score, updatedAt }
  }
  return out
}

/**
 * Composable for user ratings keyed by TMDB movie id.
 */
export function useMovieRatings() {
  const ratingsCookie = useCookie<MovieRatingsMap | null>(COOKIE_NAME, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    default: () => ({}),
  })

  const ratings = computed<MovieRatingsMap>(() =>
    parseRatingsMap(ratingsCookie.value || {}),
  )

  function getRating(movieId: string | number): MovieRatingEntry | null {
    return ratings.value[movieKey(movieId)] || null
  }

  function hasRated(movieId: string | number): boolean {
    return !!getRating(movieId)
  }

  /**
   * Set or update a rating (1–10). Returns false if score is out of range.
   */
  function rateMovie(movieId: string | number, score: number): boolean {
    const s = clampScore(score)
    if (s == null) return false
    const next = { ...ratings.value, [movieKey(movieId)]: {
      score: s,
      updatedAt: new Date().toISOString(),
    } }
    ratingsCookie.value = next
    return true
  }

  function clearRating(movieId: string | number) {
    const next = { ...ratings.value }
    delete next[movieKey(movieId)]
    ratingsCookie.value = next
  }

  /**
   * Progress across a list of TMDB movie ids (collection parts).
   */
  function progressForIds(ids: Array<string | number>): {
    total: number
    rated: number
    complete: boolean
    percent: number
    scores: Array<{ id: number; score: number | null }>
  } {
    const list = ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)
    let rated = 0
    const scores = list.map((id) => {
      const entry = getRating(id)
      if (entry) rated += 1
      return { id, score: entry?.score ?? null }
    })
    const total = list.length
    return {
      total,
      rated,
      complete: total > 0 && rated === total,
      percent: total ? Math.round((rated / total) * 100) : 0,
      scores,
    }
  }

  return {
    ratings,
    getRating,
    hasRated,
    rateMovie,
    clearRating,
    progressForIds,
  }
}
