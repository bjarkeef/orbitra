/**
 * Server-only TMDB proxy.
 * Client calls /api/tmdb/movie/550 — never sees TMDB_API.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'TMDB_API is not configured on the server',
    })
  }

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

  if (segments.some((s) => s === '..' || s.includes('\\'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const query = getQuery(event)
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (key === 'api_key') continue
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)))
    } else {
      search.set(key, String(value))
    }
  }
  search.set('api_key', String(apiKey))

  const tmdbUrl = `https://api.themoviedb.org/3/${segments.join('/')}?${search.toString()}`

  try {
    return await $fetch(tmdbUrl)
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 502
    const message =
      err?.data?.status_message ||
      err?.statusMessage ||
      'TMDB upstream request failed'
    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      statusMessage: message,
    })
  }
})