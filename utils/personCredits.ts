/**
 * Aggregate and dedupe TMDB person combined_credits (movie + TV, cast + crew).
 *
 * @module utils/personCredits
 */

export interface PersonCreditRaw {
  id: number
  credit_id?: string
  media_type?: string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  character?: string
  job?: string
  department?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  popularity?: number
  episode_count?: number
}

export type PersonCreditRoleKind = 'acting' | 'directing' | 'writing' | 'other_crew'

export interface AggregatedPersonCredit {
  /** Stable key: media|id (one row per title for displays that merge roles). */
  key: string
  id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  date: string
  year: number | null
  vote_average: number
  vote_count: number
  popularity: number
  /** All distinct roles on this title (after dedupe). */
  roles: Array<{
    kind: PersonCreditRoleKind
    label: string
    credit_id?: string
    department?: string
    job?: string
    character?: string
  }>
  primaryKind: PersonCreditRoleKind
}

export interface PersonCreditsBreakdown {
  acting: number
  directing: number
  writing: number
  other_crew: number
  movies: number
  tv: number
  totalTitles: number
}

export interface PersonCreditsBundle {
  /** One entry per title (movie/tv id), roles merged. */
  titles: AggregatedPersonCredit[]
  /** Chronological (year asc, undated last). */
  timeline: AggregatedPersonCredit[]
  breakdown: PersonCreditsBreakdown
  /** Highest vote_average with a minimum vote gate. */
  criticallyAcclaimed: AggregatedPersonCredit[]
  /** Highest vote_count (commercial / attention proxy). */
  commerciallySuccessful: AggregatedPersonCredit[]
}

function mediaOf(c: PersonCreditRaw): 'movie' | 'tv' {
  if (c.media_type === 'tv') return 'tv'
  if (c.media_type === 'movie') return 'movie'
  if (c.first_air_date && !c.release_date) return 'tv'
  if (c.name && !c.title) return 'tv'
  return 'movie'
}

function titleOf(c: PersonCreditRaw): string {
  return (
    c.title
    || c.name
    || c.original_title
    || c.original_name
    || 'Untitled'
  )
}

function dateOf(c: PersonCreditRaw): string {
  return c.release_date || c.first_air_date || ''
}

function yearOf(date: string): number | null {
  const y = date.slice(0, 4)
  if (!/^\d{4}$/.test(y)) return null
  const n = Number(y)
  return n >= 1888 && n <= 2100 ? n : null
}

function classifyRole(c: PersonCreditRaw, fromCast: boolean): {
  kind: PersonCreditRoleKind
  label: string
} {
  if (fromCast || c.character) {
    const ch = (c.character || '').trim()
    return {
      kind: 'acting',
      label: ch ? `as ${ch}` : 'Acting',
    }
  }
  const job = (c.job || '').trim()
  const dept = (c.department || '').trim()
  const jobL = job.toLowerCase()
  const deptL = dept.toLowerCase()

  if (
    deptL === 'directing'
    || jobL === 'director'
    || jobL.includes('director')
  ) {
    return { kind: 'directing', label: job || 'Director' }
  }
  if (
    deptL === 'writing'
    || jobL === 'writer'
    || jobL === 'screenplay'
    || jobL === 'story'
    || jobL === 'teleplay'
  ) {
    return { kind: 'writing', label: job || 'Writer' }
  }
  return {
    kind: 'other_crew',
    label: job || dept || 'Crew',
  }
}

function roleDedupeKey(r: {
  kind: PersonCreditRoleKind
  label: string
  job?: string
  character?: string
}): string {
  return [r.kind, r.job || '', r.character || '', r.label].join('|')
}

/**
 * Merge combined_credits.cast and .crew into per-title rows with deduped roles.
 *
 * Deduping rules:
 * 1. Title identity = `${media_type}:${id}` (same person can have many credit_ids on one title).
 * 2. Cast and crew lines for the same title are merged into one `AggregatedPersonCredit`.
 * 3. Roles are unique by kind+job+character+label (drops exact duplicate credit rows).
 * 4. Metrics (votes, popularity) take the max across lines for that title.
 */
export function aggregatePersonCredits(
  payload: { cast?: PersonCreditRaw[], crew?: PersonCreditRaw[] } | null | undefined,
  opts: { minVotesForCritical?: number } = {},
): PersonCreditsBundle {
  const minVotes = opts.minVotesForCritical ?? 100
  const map = new Map<string, AggregatedPersonCredit>()

  function ingest(list: PersonCreditRaw[] | undefined, fromCast: boolean) {
    for (const c of list || []) {
      if (!c || c.id == null) continue
      // Mainstream catalogue only (TMDB adult flag on credit lines).
      if ((c as { adult?: boolean }).adult === true) continue
      const media_type = mediaOf(c)
      const key = `${media_type}:${c.id}`
      const { kind, label } = classifyRole(c, fromCast)
      const role = {
        kind,
        label,
        credit_id: c.credit_id,
        department: c.department,
        job: c.job,
        character: c.character,
      }

      const existing = map.get(key)
      if (!existing) {
        const date = dateOf(c)
        map.set(key, {
          key,
          id: c.id,
          media_type,
          title: titleOf(c),
          poster_path: c.poster_path,
          backdrop_path: c.backdrop_path,
          date,
          year: yearOf(date),
          vote_average: Number(c.vote_average) || 0,
          vote_count: Number(c.vote_count) || 0,
          popularity: Number(c.popularity) || 0,
          roles: [role],
          primaryKind: kind,
        })
        continue
      }

      const rk = roleDedupeKey(role)
      if (!existing.roles.some(r => roleDedupeKey(r) === rk)) {
        existing.roles.push(role)
      }
      existing.vote_average = Math.max(existing.vote_average, Number(c.vote_average) || 0)
      existing.vote_count = Math.max(existing.vote_count, Number(c.vote_count) || 0)
      existing.popularity = Math.max(existing.popularity, Number(c.popularity) || 0)
      if (!existing.poster_path && c.poster_path) existing.poster_path = c.poster_path
      if (!existing.backdrop_path && c.backdrop_path) existing.backdrop_path = c.backdrop_path
      const d = dateOf(c)
      if (d && (!existing.date || d < existing.date)) {
        existing.date = d
        existing.year = yearOf(d)
      }
      // Prefer acting as primary if present
      if (kind === 'acting') existing.primaryKind = 'acting'
      else if (existing.primaryKind === 'other_crew' && kind !== 'other_crew') {
        existing.primaryKind = kind
      }
    }
  }

  ingest(payload?.cast, true)
  ingest(payload?.crew, false)

  const titles = [...map.values()]

  const breakdown: PersonCreditsBreakdown = {
    acting: 0,
    directing: 0,
    writing: 0,
    other_crew: 0,
    movies: 0,
    tv: 0,
    totalTitles: titles.length,
  }

  for (const t of titles) {
    if (t.media_type === 'movie') breakdown.movies += 1
    else breakdown.tv += 1
    const kinds = new Set(t.roles.map(r => r.kind))
    if (kinds.has('acting')) breakdown.acting += 1
    if (kinds.has('directing')) breakdown.directing += 1
    if (kinds.has('writing')) breakdown.writing += 1
    if (kinds.has('other_crew')) breakdown.other_crew += 1
  }

  const timeline = titles.slice().sort((a, b) => {
    const ya = a.year ?? 9999
    const yb = b.year ?? 9999
    if (ya !== yb) return ya - yb
    return a.title.localeCompare(b.title)
  })

  const criticallyAcclaimed = titles
    .filter(t => t.vote_count >= minVotes && t.vote_average > 0)
    .slice()
    .sort((a, b) => {
      if (b.vote_average !== a.vote_average) return b.vote_average - a.vote_average
      return b.vote_count - a.vote_count
    })
    .slice(0, 12)

  const commerciallySuccessful = titles
    .filter(t => t.vote_count > 0)
    .slice()
    .sort((a, b) => {
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count
      return b.popularity - a.popularity
    })
    .slice(0, 12)

  return {
    titles,
    timeline,
    breakdown,
    criticallyAcclaimed,
    commerciallySuccessful,
  }
}

/** Group timeline titles by year for UI. */
export function groupCreditsByYear(
  timeline: AggregatedPersonCredit[],
): Array<{ year: number | null, items: AggregatedPersonCredit[] }> {
  const order: Array<number | null> = []
  const buckets = new Map<string, AggregatedPersonCredit[]>()
  for (const t of timeline) {
    const k = t.year == null ? 'unknown' : String(t.year)
    if (!buckets.has(k)) {
      buckets.set(k, [])
      order.push(t.year)
    }
    buckets.get(k)!.push(t)
  }
  return order.map(year => ({
    year,
    items: buckets.get(year == null ? 'unknown' : String(year)) || [],
  }))
}
