/**
 * Local movie ratings / "seen" markers for collection progress.
 * Stored in localStorage (client) and mirrored to a cookie for SSR-friendly reads.
 * Rating scale: 1–10. Having a score counts as "seen" for collection completeness.
 *
 * @module composables/useMovieRatings
 */

const COOKIE_NAME = 'orbitra_movie_ratings'
const STORAGE_KEY = 'orbitra_movie_ratings'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 years

/** Per-movie entry: score 1–10, ISO timestamp when set. */
export interface MovieRatingEntry {
  score: number
  updatedAt: string
}

export type MovieRatingsMap = Record<string, MovieRatingEntry>

/** Shared across useMovieRatings() calls in one app instance (client). */
const ratingsState = ref<MovieRatingsMap>({})
let hydrated = false

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
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
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

function readLocalStorage(): MovieRatingsMap {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return parseRatingsMap(JSON.parse(raw))
  } catch {
    return {}
  }
}

function writeLocalStorage(map: MovieRatingsMap) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

/**
 * Composable for user ratings keyed by TMDB movie id.
 * Prefer reading `ratings` (reactive map) in templates; `getRating` also tracks it.
 */
export function useMovieRatings() {
  const ratingsCookie = useCookie<string | null>(COOKIE_NAME, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    default: () => null,
  })

  function persist(map: MovieRatingsMap) {
    ratingsState.value = map
    writeLocalStorage(map)
    try {
      ratingsCookie.value = Object.keys(map).length ? JSON.stringify(map) : null
    } catch {
      ratingsCookie.value = null
    }
  }

  function hydrateOnce() {
    if (hydrated) return
    hydrated = true
    const fromLs = readLocalStorage()
    let fromCookie: MovieRatingsMap = {}
    if (ratingsCookie.value) {
      try {
        const parsed =
          typeof ratingsCookie.value === 'string'
            ? JSON.parse(ratingsCookie.value)
            : ratingsCookie.value
        fromCookie = parseRatingsMap(parsed)
      } catch {
        fromCookie = {}
      }
    }
    // Prefer localStorage when it has data (more reliable on client); else cookie
    const merged =
      Object.keys(fromLs).length > 0
        ? { ...fromCookie, ...fromLs }
        : { ...fromLs, ...fromCookie }
    ratingsState.value = merged
    if (import.meta.client && Object.keys(merged).length) {
      writeLocalStorage(merged)
      try {
        ratingsCookie.value = JSON.stringify(merged)
      } catch {
        /* ignore */
      }
    }
  }

  // Run in setup so SSR cookie can seed; client merges LS on first call
  hydrateOnce()

  if (import.meta.client) {
    onMounted(() => {
      // Re-merge LS after mount in case cookie hydrated first on SSR
      const fromLs = readLocalStorage()
      if (Object.keys(fromLs).length) {
        ratingsState.value = { ...ratingsState.value, ...fromLs }
      }
    })
  }

  const ratings = computed(() => ratingsState.value)

  function getRating(movieId: string | number): MovieRatingEntry | null {
    return ratingsState.value[movieKey(movieId)] || null
  }

  /** String score for <select> binding (options are always strings). */
  function getRatingScoreString(movieId: string | number): string {
    const e = getRating(movieId)
    return e ? String(e.score) : ''
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
    const next = {
      ...ratingsState.value,
      [movieKey(movieId)]: {
        score: s,
        updatedAt: new Date().toISOString(),
      },
    }
    persist(next)
    return true
  }

  function clearRating(movieId: string | number) {
    const next = { ...ratingsState.value }
    delete next[movieKey(movieId)]
    persist(next)
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
    const map = ratingsState.value
    const scores = list.map((id) => {
      const entry = map[movieKey(id)]
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
    getRatingScoreString,
    hasRated,
    rateMovie,
    clearRating,
    progressForIds,
  }
}
