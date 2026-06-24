/**
 * Build orbital co-star graph on the server (TMDB key never leaves Nitro).
 * Cached in-memory for 24h per actor+params to avoid N+1 storms on every visit.
 */
type GraphNode = {
  id: string
  tmdbId: number
  type: 'actor' | 'project' | 'costar' | 'repeat'
  label: string
  image?: string | null
  mediaType?: string
  year?: string
  voteCount?: number
  voteAverage?: number
  character?: string
  collabCount?: number
  r: number
}

type GraphLink = {
  sourceId: string
  targetId: string
  kind: string
}

type GraphPayload = {
  personId: number
  personName: string
  nodes: GraphNode[]
  links: GraphLink[]
  truncated: boolean
  projectCount: number
  insights: {
    totalProjects: number
    totalCostars: number
    repeatCollaborators: number
  }
  builtAt: string
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const graphCache = new Map<string, { expires: number; data: GraphPayload }>()

async function tmdbServer<T>(apiKey: string, path: string, query: Record<string, string | number> = {}): Promise<T> {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) search.set(k, String(v))
  search.set('api_key', apiKey)
  const url = `https://api.themoviedb.org/3/${path.replace(/^\/+/, '')}?${search}`
  return await $fetch<T>(url)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TMDB_API is not configured on the server' })
  }

  const idParam = event.context.params?.id
  const personId = Number(idParam)
  if (!Number.isFinite(personId) || personId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid person id' })
  }

  const q = getQuery(event)
  const maxProjects = Math.min(40, Math.max(5, Number(q.maxProjects) || 24))
  const topCastPerProject = Math.min(12, Math.max(3, Number(q.topCast) || 8))
  const cacheKey = `${personId}:${maxProjects}:${topCastPerProject}`

  const cached = graphCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    setHeader(event, 'X-Orbitra-Cache', 'HIT')
    return cached.data
  }

  setHeader(event, 'X-Orbitra-Cache', 'MISS')

  const person = await tmdbServer<{ id: number; name: string; profile_path?: string }>(
    apiKey,
    `person/${personId}`
  )
  const creditsPayload = await tmdbServer<{ cast?: any[] }>(apiKey, `person/${personId}/combined_credits`)

  const seen = new Set<string>()
  let projects = (creditsPayload.cast || [])
    .filter((c: any) => {
      const key = `${c.media_type || 'movie'}-${c.id}`
      if (!c.id || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))

  let truncated = false
  if (projects.length > maxProjects) {
    truncated = true
    projects = projects.slice(0, maxProjects)
  }

  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const nodeMap = new Map<string, GraphNode>()
  const collabCount = new Map<number, number>()

  const addNode = (n: GraphNode) => {
    if (!nodeMap.has(n.id)) {
      nodeMap.set(n.id, n)
      nodes.push(n)
    }
    return nodeMap.get(n.id)!
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
      batch.map(async (proj: any) => {
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

        try {
          const data = await tmdbServer<{ cast?: any[] }>(apiKey, `${mediaType}/${proj.id}/credits`)
          const cast = (data.cast || []).slice(0, topCastPerProject)
          for (const member of cast) {
            if (member.id === personId) continue
            const cId = `person-${member.id}`
            addNode({
              id: cId,
              tmdbId: member.id,
              type: 'costar',
              label: member.name,
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
          /* skip failed title */
        }
      })
    )
    // gentle pacing toward TMDB
    if (i + batchSize < projects.length) {
      await new Promise((r) => setTimeout(r, 120))
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

  graphCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: payload })
  return payload
})