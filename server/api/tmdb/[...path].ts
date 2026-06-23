/**
 * Server-only TMDB proxy.
 * Client calls /api/tmdb/movie/550 — never sees TMDB_API.
 */
const ALLOWED_ROOTS = new Set([
  'movie',
  'tv',
  'person',
  'search',
  'trending',
  'discover',
  'collection',
  'genre',
  'configuration',
  'credit',
  'keyword',
  'company',
  'network',
  'watch',
  'certification',
])

export default defineEventHandler(async (event) => {
  requireTmdbApiKey()

  const pathParam = event.context.params?.path
  const segments = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === 'string'
      ? pathParam.split('/').filter(Boolean)
      : []

  if (!segments.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing TMDB path. Use /api/tmdb/{resource}/...',
    })
  }

  if (segments.some((s) => !s || s === '..' || s.includes('\\') || s.includes('\0'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const root = segments[0]
  if (!ALLOWED_ROOTS.has(root)) {
    throw createError({
      statusCode: 400,
      statusMessage: `TMDB path root "${root}" is not allowed`,
    })
  }

  const query = getQuery(event) as Record<string, unknown>
  return await tmdbFetch(segments.join('/'), query)
})
