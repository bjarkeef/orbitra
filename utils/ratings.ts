/**
 * TMDB community scores + display helpers.
 *
 * Best practice (catalog UIs):
 * - Always show score **with** vote_count when space allows — average alone is noisy on low-N titles.
 * - Hide or de-emphasize scores with vote_average ≈ 0 or very few votes (unrated / not enough signal).
 * - Use a single visual language (badge on posters, richer meter on detail).
 * - Separate **community** (TMDB) from **yours** (local 1–10 for collections).
 */

export type RatingTier = 'none' | 'low' | 'mixed' | 'good' | 'great'

/** Minimum votes before we treat the average as trustworthy on posters. */
export const RATING_MIN_VOTES_POSTER = 20
/** Detail pages can show lower-N with an explicit count. */
export const RATING_MIN_VOTES_DETAIL = 1

export function tierFromScore(score: number | null | undefined): RatingTier {
  if (score == null || !Number.isFinite(score) || score <= 0) return 'none'
  if (score < 5) return 'low'
  if (score < 6.5) return 'mixed'
  if (score < 7.5) return 'good'
  return 'great'
}

/** Tailwind-friendly classes for tier (text + ring/bg accents). */
export function tierClasses(tier: RatingTier): { text: string, ring: string, bg: string, bar: string } {
  switch (tier) {
    case 'great':
      return {
        text: 'text-emerald-200',
        ring: 'ring-emerald-500/40',
        bg: 'bg-emerald-950/80',
        bar: 'bg-emerald-400',
      }
    case 'good':
      return {
        text: 'text-lime-200',
        ring: 'ring-lime-500/35',
        bg: 'bg-lime-950/70',
        bar: 'bg-lime-400',
      }
    case 'mixed':
      return {
        text: 'text-amber-200',
        ring: 'ring-amber-500/35',
        bg: 'bg-amber-950/70',
        bar: 'bg-amber-400',
      }
    case 'low':
      return {
        text: 'text-rose-200',
        ring: 'ring-rose-500/35',
        bg: 'bg-rose-950/70',
        bar: 'bg-rose-400',
      }
    default:
      return {
        text: 'text-slate-400',
        ring: 'ring-slate-600/40',
        bg: 'bg-slate-900/80',
        bar: 'bg-slate-600',
      }
  }
}

export function parseScore(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.min(10, Math.max(0, n))
}

export function parseVoteCount(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

/** One decimal, e.g. 7.8 — empty string if not displayable. */
export function formatScore(raw: unknown): string {
  const n = parseScore(raw)
  if (n == null) return ''
  return n.toFixed(1)
}

/** 1.2K / 3.4M style counts. */
export function formatVoteCount(raw: unknown): string {
  const n = parseVoteCount(raw)
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    const k = n / 1000
    return (k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')) + 'K'
  }
  const m = n / 1_000_000
  return (m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')) + 'M'
}

/**
 * Whether to show a compact poster badge.
 * Suppresses unrated (0) and very low vote_count to avoid misleading 10.0-from-1-vote noise.
 */
export function shouldShowPosterRating(
  voteAverage: unknown,
  voteCount: unknown,
  minVotes = RATING_MIN_VOTES_POSTER,
): boolean {
  const score = parseScore(voteAverage)
  if (score == null) return false
  return parseVoteCount(voteCount) >= minVotes
}

export function scorePercent(raw: unknown): number {
  const n = parseScore(raw)
  if (n == null) return 0
  return Math.round((n / 10) * 100)
}
