/**
 * Server-only TMDB proxy.
 * Client calls /api/tmdb/movie/550 — never sees TMDB_API.
 */
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

  const query = getQuery(event) as Record<string, unknown>
  return await tmdbFetch(segments.join('/'), query)
})
