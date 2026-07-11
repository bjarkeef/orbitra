/**
 * Orbit graph query helpers — URL sync + API query building.
 */

import type { OrbitGraphQuery, OrbitMediaFilter, OrbitRankMode } from './orbitTypes'

export function parseOrbitMedia(v: unknown): OrbitMediaFilter {
  const s = String(v || 'all')
  if (s === 'movie' || s === 'tv') return s
  return 'all'
}

export function parseOrbitRank(v: unknown): OrbitRankMode {
  const s = String(v || 'popular')
  if (s === 'recent' || s === 'top_rated' || s === 'hybrid') return s
  return 'popular'
}

export function parseOptionalYear(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const y = Math.trunc(n)
  if (y < 1900 || y > 2100) return null
  return y
}

/** Read orbit controls from a route query object. */
export function orbitQueryFromRouteQuery(
  q: Record<string, unknown>,
  defaults: { maxProjects: number, topCast: number },
): OrbitGraphQuery {
  return {
    maxProjects: clampInt(q.maxProjects, 5, 40, defaults.maxProjects),
    topCast: clampInt(q.topCast ?? q.topCastPerProject, 3, 12, defaults.topCast),
    media: parseOrbitMedia(q.media),
    rank: parseOrbitRank(q.rank),
    yearFrom: parseOptionalYear(q.yearFrom),
    yearTo: parseOptionalYear(q.yearTo),
  }
}

export function orbitQueryToApiParams(query: OrbitGraphQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    maxProjects: query.maxProjects,
    topCast: query.topCast,
    media: query.media,
    rank: query.rank,
  }
  if (query.yearFrom != null) params.yearFrom = query.yearFrom
  if (query.yearTo != null) params.yearTo = query.yearTo
  return params
}

/** Partial route query patch for orbit controls (omit defaults to keep URLs clean). */
export function orbitQueryToRoutePatch(
  query: OrbitGraphQuery,
  defaults: { maxProjects: number, topCast: number },
): Record<string, string | undefined> {
  return {
    media: query.media === 'all' ? undefined : query.media,
    rank: query.rank === 'popular' ? undefined : query.rank,
    yearFrom: query.yearFrom != null ? String(query.yearFrom) : undefined,
    yearTo: query.yearTo != null ? String(query.yearTo) : undefined,
    maxProjects:
      query.maxProjects !== defaults.maxProjects ? String(query.maxProjects) : undefined,
    topCast: query.topCast !== defaults.topCast ? String(query.topCast) : undefined,
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/** Decade options for filter UI. */
export function orbitDecadeOptions(
  yearSpan?: { min: number, max: number } | null,
): Array<{ label: string, from: number | null, to: number | null }> {
  const opts: Array<{ label: string, from: number | null, to: number | null }> = [
    { label: 'All years', from: null, to: null },
  ]
  const minY = yearSpan?.min ?? 1970
  const maxY = yearSpan?.max ?? new Date().getFullYear()
  const startDecade = Math.floor(minY / 10) * 10
  const endDecade = Math.floor(maxY / 10) * 10
  for (let d = endDecade; d >= startDecade; d -= 10) {
    opts.push({ label: `${d}s`, from: d, to: d + 9 })
  }
  return opts
}
