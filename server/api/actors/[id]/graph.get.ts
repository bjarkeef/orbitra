/**
 * Build orbital co-star graph on the server (TMDB key never leaves Nitro).
 * Cached in-memory for 24h per actor+params to avoid N+1 storms on every visit.
 *
 * Query params:
 * - `maxProjects` (5–40, default 24) — how many titles to pull into the orbit
 * - `topCast` (3–12, default 8) — co-stars per title
 *
 * @route GET /api/actors/:id/graph
 * @returns {@link GraphPayload}
 * @throws 400 invalid person id
 * @throws 500 missing TMDB config
 * @throws 502/4xx when core person/credits TMDB calls fail
 *
 * @module server/api/actors/[id]/graph.get
 */

import { MemoryCache } from '../../../utils/memoryCache'

/** Node kinds rendered by `ActorGraph.vue`. */
export type GraphNodeType = 'actor' | 'project' | 'costar' | 'repeat'

/** Force-layout node sent to the client canvas. */
export interface GraphNode {
  id: string
  tmdbId: number
  type: GraphNodeType
  label: string
  image?: string | null
  mediaType?: string
  year?: string
  voteCount?: number
  voteAverage?: number
  character?: string
  collabCount?: number
  /** Radius hint for canvas drawing */
  r: number
}

/** Undirected edge between graph node ids. */
export interface GraphLink {
  sourceId: string
  targetId: string
  kind: string
}

/** Summary stats for the orbit panel. */
export interface GraphInsights {
  totalProjects: number
  totalCostars: number
  repeatCollaborators: number
}

/** Full API response for the actor orbit. */
export interface GraphPayload {
  personId: number
  personName: string
  nodes: GraphNode[]
  links: GraphLink[]
  truncated: boolean
  projectCount: number
  insights: GraphInsights
  builtAt: string
}

/** Minimal person payload from TMDB. */
interface TmdbPersonLite {
  id: number
  name: string
  profile_path?: string | null
}

/** Credit line on combined_credits / title credits. */
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
}

interface TmdbCombinedCreditsLite {
  cast?: TmdbCreditCastLine[]
}

interface TmdbTitleCreditsLite {
  cast?: TmdbCreditCastLine[]
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TMDB_API_BASE = 'https://api.themoviedb.org/3'

/** Process-local graph cache (lost on server restart — acceptable for this phase). */
const graphCache = new MemoryCache<GraphPayload>({ maxEntries: 200 })

/**
 * Server-side TMDB GET with typed JSON body.
 * Unlike the public proxy, this is only used inside Nitro handlers.
 *
 * @typeParam T - Expected response type
 * @param apiKey - TMDB v3 API key
 * @param path - Path under `/3/` (leading slash optional)
 * @param query - Extra query params (api_key appended automatically)
 * @returns Parsed JSON
 * @throws Propagates `$fetch` errors to the caller for handling
 */
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
    return await $fetch<T>(url, { headers: { Accept: 'application/json' } })
  } catch (err: unknown) {
    const e = err as {
      statusCode?: number
      statusMessage?: string
      data?: { status_message?: string }
      response?: { status?: number }
    }
    const status = e.response?.status || e.statusCode || 502
    const message =
      e.data?.status_message ||
      e.statusMessage ||
      'TMDB request failed while building orbit'
    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      statusMessage: String(message),
    })
  }
}

/**
 * Clamp integer query params into an inclusive range with a default.
 *
 * @param value - Raw query value
 * @param min - Inclusive minimum
 * @param max - Inclusive maximum
 * @param fallback - Used when NaN / missing
 */
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/**
 * Short delay between credit batches to reduce TMDB burst rate limits.
 *
 * @param ms - Milliseconds to wait
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * GET handler: build or serve cached co-star orbit for one person.
 *
 * @param event - H3 event (`params.id` = TMDB person id)
 * @returns Graph payload for `ActorGraph`
 */
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
  const cacheKey = `${personId}:${maxProjects}:${topCastPerProject}`

  const cached = graphCache.get(cacheKey)
  if (cached) {
    setHeader(event, 'X-Orbitra-Cache', 'HIT')
    setHeader(event, 'Cache-Control', 'private, max-age=86400')
    return cached
  }

  setHeader(event, 'X-Orbitra-Cache', 'MISS')

  // Core fetches must succeed — without person/credits there is no orbit
  let person: TmdbPersonLite
  let creditsPayload: TmdbCombinedCreditsLite
  try {
    ;[person, creditsPayload] = await Promise.all([
      tmdbServer<TmdbPersonLite>(String(apiKey), `person/${personId}`),
      tmdbServer<TmdbCombinedCreditsLite>(
        String(apiKey),
        `person/${personId}/combined_credits`,
      ),
    ])
  } catch (err: unknown) {
    // tmdbServer already throws H3 errors; rethrow only if not already shaped
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
  let projects = (creditsPayload.cast || [])
    .filter((c: TmdbCreditCastLine) => {
      if (!c?.id) return false
      const key = `${c.media_type || 'movie'}-${c.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort(
      (a: TmdbCreditCastLine, b: TmdbCreditCastLine) =>
        (b.vote_count || 0) - (a.vote_count || 0),
    )

  let truncated = false
  if (projects.length > maxProjects) {
    truncated = true
    projects = projects.slice(0, maxProjects)
  }

  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const nodeMap = new Map<string, GraphNode>()
  const collabCount = new Map<number, number>()

  const addNode = (n: GraphNode): GraphNode => {
    const existing = nodeMap.get(n.id)
    if (existing) return existing
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
    r: 28,
  })

  const batchSize = 5
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (proj: TmdbCreditCastLine) => {
        if (!proj.id) return

        const mediaType = proj.media_type === 'tv' ? 'tv' : 'movie'
        const pNode = addNode({
          id: `${mediaType}-${proj.id}`,
          tmdbId: proj.id,
          type: 'project',
          mediaType,
          label: proj.title || proj.name || 'Untitled',
          image: proj.poster_path,
          year: (proj.release_date || proj.first_air_date || '').slice(0, 4),
          voteCount: proj.vote_count || 0,
          voteAverage: proj.vote_average || 0,
          character: proj.character || '',
          r: 14 + Math.min(10, Math.log10((proj.vote_count || 1) + 1) * 4),
        })

        links.push({
          sourceId: `person-${personId}`,
          targetId: pNode.id,
          kind: 'acted-in',
        })

        // Per-title credits are best-effort: one 404 must not fail the whole orbit
        try {
          const data = await tmdbServer<TmdbTitleCreditsLite>(
            String(apiKey),
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
              r: 9,
            })
            links.push({
              sourceId: pNode.id,
              targetId: cId,
              kind: 'cast-in',
            })
            collabCount.set(member.id, (collabCount.get(member.id) || 0) + 1)
          }
        } catch {
          /* skip failed title credits */
        }
      }),
    )
    // Gentle pacing toward TMDB
    if (i + batchSize < projects.length) {
      await sleep(120)
    }
  }

  let repeatCollaborators = 0
  for (const [cid, count] of collabCount) {
    if (count >= 2) {
      const n = nodeMap.get(`person-${cid}`)
      if (n) {
        n.type = 'repeat'
        n.collabCount = count
        n.r = 9 + Math.min(8, count)
        repeatCollaborators++
      }
    }
  }

  const payload: GraphPayload = {
    personId,
    personName: person.name,
    nodes,
    links,
    truncated,
    projectCount: projects.length,
    insights: {
      totalProjects: projects.length,
      totalCostars: nodes.filter((n) => n.type === 'costar' || n.type === 'repeat').length,
      repeatCollaborators,
    },
    builtAt: new Date().toISOString(),
  }

  graphCache.set(cacheKey, payload, CACHE_TTL_MS)
  setHeader(event, 'Cache-Control', 'private, max-age=86400')
  return payload
})