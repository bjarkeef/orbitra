/**
 * Build orbital co-star graph on the server (TMDB key never leaves Nitro).
 * Cached in-memory for 24h per actor+params to avoid N+1 storms on every visit.
 *
 * Query params:
 * - maxProjects (5-40, default 24)
 * - topCast (3-12, default 8)
 * - media: all | movie | tv
 * - rank: popular | recent | top_rated | hybrid
 * - yearFrom / yearTo: optional inclusive year filters
 *
 * @route GET /api/actors/:id/graph
 */

import { MemoryCache } from '../../../utils/memoryCache'
import type {
  GraphInsights,
  GraphLink,
  GraphNode,
  GraphPayload,
  GraphSharedTitle,
  GraphTopCollaborator,
  OrbitMediaFilter,
  OrbitRankMode,
} from '../../../../utils/orbitTypes'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TMDB_API_BASE = 'https://api.themoviedb.org/3'

const graphCache = new MemoryCache<GraphPayload>({ maxEntries: 200 })
const inflight = new Map<string, Promise<GraphPayload>>()

interface TmdbPersonLite {
  id: number
  name: string
  profile_path?: string | null
}

interface TmdbCreditCastLine {
  id?: number
  media_type?: string
  title?: string
  name?: string
  poster_path?: string | null
  profile_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_count?: number
  vote_average?: number
  character?: string
  adult?: boolean
}

interface TmdbCombinedCreditsLite {
  cast?: TmdbCreditCastLine[]
}

interface TmdbTitleCreditsLite {
  cast?: TmdbCreditCastLine[]
}

async function tmdbServer<T>(
  apiKey: string,
  path: string,
  query: Record<string, string | number> = {},
): Promise<T> {
  const clean = path.replace(/^\/+/, '')
  if (!clean || clean.includes('..')) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid internal TMDB path' })
  }

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) search.set(k, String(v))
  search.set('api_key', apiKey)
  const url = `${TMDB_API_BASE}/${clean}?${search}`

  try {
    return (await $fetch(url, {
      headers: { Accept: 'application/json' },
      // Bound hangs so one slow TMDB call cannot wedge Nitro's event loop queue.
      timeout: 12_000,
      retry: 0,
    })) as T
  }
  catch (err: unknown) {
    const e = err as {
      statusCode?: number
      statusMessage?: string
      data?: { status_message?: string }
      response?: { status?: number }
    }
    const status = e.response?.status || e.statusCode || 502
    const message
      = e.data?.status_message
        || e.statusMessage
        || 'TMDB request failed while building orbit'
    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      statusMessage: String(message),
    })
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function parseMedia(v: unknown): OrbitMediaFilter {
  const s = String(v || 'all')
  if (s === 'movie' || s === 'tv') return s
  return 'all'
}

function parseRank(v: unknown): OrbitRankMode {
  const s = String(v || 'popular')
  if (s === 'recent' || s === 'top_rated' || s === 'hybrid') return s
  return 'popular'
}

function parseYear(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const y = Math.trunc(n)
  if (y < 1900 || y > 2100) return null
  return y
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function creditYear(c: TmdbCreditCastLine): number | null {
  const raw = (c.release_date || c.first_air_date || '').slice(0, 4)
  const y = Number(raw)
  return Number.isFinite(y) && y > 0 ? y : null
}

function scoreProject(c: TmdbCreditCastLine, rank: OrbitRankMode, nowYear: number): number {
  const votes = c.vote_count || 0
  const avg = c.vote_average || 0
  const year = creditYear(c)
  const recency = year != null ? Math.max(0, 40 - (nowYear - year)) : 0
  if (rank === 'recent') return recency * 1000 + votes
  if (rank === 'top_rated') return avg * 10000 + Math.log10(votes + 1) * 100
  if (rank === 'hybrid') {
    const normVotes = Math.log10(votes + 1)
    return normVotes * 0.55 + (avg / 10) * 0.3 + (recency / 40) * 0.15
  }
  return votes
}

function selectProjects(
  all: TmdbCreditCastLine[],
  maxProjects: number,
  rank: OrbitRankMode,
): TmdbCreditCastLine[] {
  const nowYear = new Date().getFullYear()
  const sorted = all
    .slice()
    .sort((a, b) => scoreProject(b, rank, nowYear) - scoreProject(a, rank, nowYear))

  if (rank !== 'hybrid' && rank !== 'popular') {
    return sorted.slice(0, maxProjects)
  }

  const primary = sorted.slice(0, maxProjects)
  if (primary.length < maxProjects) return primary

  const picked = new Set(primary.map(p => `${p.media_type}-${p.id}`))
  const decadeCount = new Map<number, number>()
  for (const p of primary) {
    const y = creditYear(p)
    if (y == null) continue
    const d = Math.floor(y / 10) * 10
    decadeCount.set(d, (decadeCount.get(d) || 0) + 1)
  }

  const injectSlots = Math.min(4, Math.floor(maxProjects / 6))
  let injected = 0
  for (const cand of sorted) {
    if (injected >= injectSlots) break
    const key = `${cand.media_type}-${cand.id}`
    if (picked.has(key)) continue
    const y = creditYear(cand)
    if (y == null) continue
    const d = Math.floor(y / 10) * 10
    if ((decadeCount.get(d) || 0) >= 2) continue
    primary[primary.length - 1 - injected] = cand
    picked.add(key)
    decadeCount.set(d, (decadeCount.get(d) || 0) + 1)
    injected++
  }
  return primary
}

async function buildGraph(options: {
  apiKey: string
  personId: number
  maxProjects: number
  topCastPerProject: number
  media: OrbitMediaFilter
  rank: OrbitRankMode
  yearFrom: number | null
  yearTo: number | null
}): Promise<GraphPayload> {
  const {
    apiKey,
    personId,
    maxProjects,
    topCastPerProject,
    media,
    rank,
    yearFrom,
    yearTo,
  } = options

  const t0 = Date.now()

  let person: TmdbPersonLite
  let creditsPayload: TmdbCombinedCreditsLite
  try {
    ;[person, creditsPayload] = await Promise.all([
      tmdbServer<TmdbPersonLite>(apiKey, `person/${personId}`),
      tmdbServer<TmdbCombinedCreditsLite>(apiKey, `person/${personId}/combined_credits`),
    ])
  }
  catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not load person or credits from TMDB',
    })
  }

  if (!person?.name) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Person not found on TMDB',
    })
  }

  const seen = new Set<string>()
  const pool = (creditsPayload.cast || []).filter((c: TmdbCreditCastLine) => {
    if (!c?.id) return false
    if (c.adult === true) return false
    const mt = c.media_type === 'tv' ? 'tv' : 'movie'
    if (media === 'movie' && mt !== 'movie') return false
    if (media === 'tv' && mt !== 'tv') return false
    const y = creditYear(c)
    if (yearFrom != null && (y == null || y < yearFrom)) return false
    if (yearTo != null && (y == null || y > yearTo)) return false
    const key = `${mt}-${c.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let minY = Infinity
  let maxY = -Infinity
  let movieCount = 0
  let tvCount = 0
  for (const c of pool) {
    const mt = c.media_type === 'tv' ? 'tv' : 'movie'
    if (mt === 'tv') tvCount++
    else movieCount++
    const y = creditYear(c)
    if (y != null) {
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }

  let truncated = false
  if (pool.length > maxProjects) truncated = true
  const projects = selectProjects(pool, maxProjects, rank)

  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const nodeMap = new Map<string, GraphNode>()
  const collabCount = new Map<number, number>()
  const collabTitles = new Map<number, GraphSharedTitle[]>()

  const addNode = (n: GraphNode): GraphNode => {
    const existing = nodeMap.get(n.id)
    if (existing) {
      // Later credits often include profile/poster paths the first hit lacked.
      if (!existing.image && n.image) existing.image = n.image
      if ((existing.collabCount || 0) < (n.collabCount || 0)) {
        existing.collabCount = n.collabCount
      }
      return existing
    }
    nodeMap.set(n.id, n)
    nodes.push(n)
    return n
  }

  addNode({
    id: `person-${personId}`,
    tmdbId: personId,
    type: 'actor',
    label: person.name,
    image: person.profile_path,
    r: 30,
  })

  const batchSize = 5
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (proj: TmdbCreditCastLine) => {
        if (!proj.id) return

        const mediaType = proj.media_type === 'tv' ? 'tv' : 'movie'
        const year = (proj.release_date || proj.first_air_date || '').slice(0, 4)
        const pNode = addNode({
          id: `${mediaType}-${proj.id}`,
          tmdbId: proj.id,
          type: 'project',
          mediaType,
          label: proj.title || proj.name || 'Untitled',
          image: proj.poster_path,
          year,
          voteCount: proj.vote_count || 0,
          voteAverage: proj.vote_average || 0,
          character: proj.character || '',
          r: 14 + Math.min(10, Math.log10((proj.vote_count || 1) + 1) * 4),
        })

        links.push({
          sourceId: `person-${personId}`,
          targetId: pNode.id,
          kind: 'acted-in',
          weight: 1,
        })

        try {
          const data = await tmdbServer<TmdbTitleCreditsLite>(
            apiKey,
            `${mediaType}/${proj.id}/credits`,
          )
          const cast = (data.cast || []).slice(0, topCastPerProject)
          for (const member of cast) {
            if (!member?.id || member.id === personId) continue
            const cId = `person-${member.id}`
            addNode({
              id: cId,
              tmdbId: member.id,
              type: 'costar',
              label: member.name || 'Unknown',
              image: member.profile_path,
              r: 10,
            })
            links.push({
              sourceId: pNode.id,
              targetId: cId,
              kind: 'cast-in',
              weight: 1,
            })
            collabCount.set(member.id, (collabCount.get(member.id) || 0) + 1)
            const shared = collabTitles.get(member.id) || []
            if (shared.length < 6) {
              shared.push({
                id: proj.id!,
                mediaType,
                title: proj.title || proj.name || 'Untitled',
                year,
              })
              collabTitles.set(member.id, shared)
            }
          }
        }
        catch {
          /* skip failed title credits */
        }
      }),
    )
    if (i + batchSize < projects.length) await sleep(120)
  }

  let repeatCollaborators = 0
  const topCollaborators: GraphTopCollaborator[] = []
  for (const [cid, count] of collabCount) {
    if (count >= 2) {
      const n = nodeMap.get(`person-${cid}`)
      if (n) {
        n.type = 'repeat'
        n.collabCount = count
        n.r = 10 + Math.min(8, count)
        repeatCollaborators++
        topCollaborators.push({
          tmdbId: n.tmdbId,
          label: n.label,
          image: n.image,
          collabCount: count,
          sharedTitles: collabTitles.get(cid) || [],
        })
      }
    }
  }
  topCollaborators.sort((a, b) => b.collabCount - a.collabCount || a.label.localeCompare(b.label))

  for (const l of links) {
    if (l.kind !== 'cast-in') continue
    const tid = l.targetId
    if (!tid.startsWith('person-')) continue
    const idNum = Number(tid.replace('person-', ''))
    l.weight = collabCount.get(idNum) || 1
  }

  const insights: GraphInsights = {
    totalProjects: projects.length,
    totalCostars: nodes.filter(n => n.type === 'costar' || n.type === 'repeat').length,
    repeatCollaborators,
    topCollaborators: topCollaborators.slice(0, 10),
    yearSpan: Number.isFinite(minY) && Number.isFinite(maxY) ? { min: minY, max: maxY } : null,
    mediumSplit: { movie: movieCount, tv: tvCount },
  }

  return {
    personId,
    personName: person.name,
    nodes,
    links,
    truncated,
    projectCount: projects.length,
    insights,
    builtAt: new Date().toISOString(),
    meta: {
      cache: 'MISS',
      buildMs: Date.now() - t0,
      partial: false,
      media,
      rank,
      yearFrom,
      yearTo,
    },
  }
}

export default defineEventHandler(async (event): Promise<GraphPayload> => {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI
  if (!apiKey || typeof apiKey !== 'string') {
    throw createError({
      statusCode: 500,
      statusMessage: 'TMDB_API is not configured on the server',
    })
  }

  const idParam = event.context.params?.id
  const personId = Number(idParam)
  if (!Number.isFinite(personId) || personId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person id' })
  }

  const q = getQuery(event)
  const maxProjects = clampInt(q.maxProjects, 5, 40, 24)
  const topCastPerProject = clampInt(q.topCast, 3, 12, 8)
  const media = parseMedia(q.media)
  const rank = parseRank(q.rank)
  const yearFrom = parseYear(q.yearFrom)
  const yearTo = parseYear(q.yearTo)

  const cacheKey = [
    personId,
    maxProjects,
    topCastPerProject,
    media,
    rank,
    yearFrom ?? '',
    yearTo ?? '',
  ].join(':')

  const cached = graphCache.get(cacheKey)
  if (cached) {
    setHeader(event, 'X-Orbitra-Cache', 'HIT')
    setHeader(event, 'Cache-Control', 'private, max-age=86400')
    return {
      ...cached,
      meta: { ...cached.meta, cache: 'HIT' },
    }
  }

  setHeader(event, 'X-Orbitra-Cache', 'MISS')

  let pending = inflight.get(cacheKey)
  if (!pending) {
    pending = buildGraph({
      apiKey: String(apiKey),
      personId,
      maxProjects,
      topCastPerProject,
      media,
      rank,
      yearFrom,
      yearTo,
    })
      .then((payload) => {
        graphCache.set(cacheKey, payload, CACHE_TTL_MS)
        return payload
      })
      .finally(() => {
        inflight.delete(cacheKey)
      })
    inflight.set(cacheKey, pending)
  }

  const payload = await pending
  setHeader(event, 'Cache-Control', 'private, max-age=86400')
  return payload
})
