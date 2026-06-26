/**
 * Browse Orbitra's curated TMDB collections with optional genre filter.
 * Enriches each id via TMDB GET /collection/{id} (cached through proxy TTL policy).
 * Completeness is client-side (user ratings cookie) — this endpoint returns part lists only.
 *
 * Query:
 * - genre: TMDB genre id — keep collections where any part has that genre_id
 * - q: substring match on collection name
 * - minParts / maxParts: part count filters
 *
 * @route GET /api/collections
 */

import { uniqueCatalogIds } from '../../utils/collectionCatalog'
import {
  MemoryCache,
  cacheKeyFromPathQuery,
} from '../../utils/memoryCache'

interface TmdbPart {
  id: number
  title?: string
  release_date?: string
  poster_path?: string | null
  genre_ids?: number[]
  vote_average?: number
  adult?: boolean
}

interface TmdbCollectionBody {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  parts?: TmdbPart[]
}

export interface CollectionBrowseItem {
  id: number
  name: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  part_count: number
  part_ids: number[]
  genre_ids: number[]
  first_release_date?: string | null
  last_release_date?: string | null
}

const listCache = new MemoryCache<CollectionBrowseItem[]>({ maxEntries: 20 })
const LIST_TTL_MS = 6 * 60 * 60 * 1000 // 6h — catalog is stable

async function fetchCollection(
  apiKey: string,
  id: number,
): Promise<TmdbCollectionBody | null> {
  const url = `https://api.themoviedb.org/3/collection/${id}?api_key=${encodeURIComponent(apiKey)}`
  try {
    return await $fetch<TmdbCollectionBody>(url, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    return null
  }
}

function toBrowseItem(c: TmdbCollectionBody): CollectionBrowseItem | null {
  if (!c?.id || !c.name) return null
  const parts = (c.parts || []).filter((p) => p && p.id)
  const genreSet = new Set<number>()
  const dates: string[] = []
  for (const p of parts) {
    for (const g of p.genre_ids || []) {
      if (Number.isFinite(g)) genreSet.add(Number(g))
    }
    if (p.release_date) dates.push(p.release_date)
  }
  dates.sort()
  return {
    id: c.id,
    name: c.name,
    overview: c.overview,
    poster_path: c.poster_path,
    backdrop_path: c.backdrop_path,
    part_count: parts.length,
    part_ids: parts.map((p) => p.id),
    genre_ids: [...genreSet].sort((a, b) => a - b),
    first_release_date: dates[0] || null,
    last_release_date: dates[dates.length - 1] || null,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI
  if (!apiKey || typeof apiKey !== 'string') {
    throw createError({
      statusCode: 500,
      statusMessage: 'TMDB_API is not configured on the server',
    })
  }

  const query = getQuery(event)
  const genreRaw = query.genre != null ? Number(query.genre) : null
  const genreId =
    genreRaw != null && Number.isFinite(genreRaw) && genreRaw > 0 ? genreRaw : null
  const q = String(query.q || '').trim().toLowerCase()
  const minParts = query.minParts != null ? Number(query.minParts) : null
  const maxParts = query.maxParts != null ? Number(query.maxParts) : null

  const cacheKey = cacheKeyFromPathQuery('orbitra/collections-catalog', { v: 1 })
  let catalog = listCache.get(cacheKey)

  if (!catalog) {
    const ids = uniqueCatalogIds()
    const settled = await Promise.all(ids.map((id) => fetchCollection(String(apiKey), id)))
    catalog = []
    for (const body of settled) {
      if (!body) continue
      const item = toBrowseItem(body)
      if (item && item.part_count > 0) catalog.push(item)
    }
    catalog.sort((a, b) => a.name.localeCompare(b.name))
    listCache.set(cacheKey, catalog, LIST_TTL_MS)
  }

  let results = catalog.slice()

  if (genreId != null) {
    results = results.filter((c) => c.genre_ids.includes(genreId))
  }
  if (q) {
    results = results.filter((c) => c.name.toLowerCase().includes(q))
  }
  if (minParts != null && Number.isFinite(minParts)) {
    results = results.filter((c) => c.part_count >= minParts)
  }
  if (maxParts != null && Number.isFinite(maxParts)) {
    results = results.filter((c) => c.part_count <= maxParts)
  }

  setHeader(event, 'Cache-Control', 'private, max-age=300')
  return {
    results,
    total: results.length,
    catalog_size: catalog.length,
  }
})
