/**
 * Shared server-side TMDB access (API key stays on Nitro only).
 */
export function requireTmdbApiKey(): string {
  const config = useRuntimeConfig()
  const apiKey = config.tmdbAPI
  if (!apiKey || typeof apiKey !== 'string') {
    throw createError({
      statusCode: 500,
      statusMessage: 'TMDB_API is not configured on the server',
    })
  }
  return apiKey
}

export function buildTmdbUrl(
  path: string,
  query: Record<string, unknown> = {},
  apiKey?: string
): string {
  const key = apiKey ?? requireTmdbApiKey()
  const clean = path.replace(/^\/+/, '').replace(/\.\./g, '')
  const search = new URLSearchParams()

  for (const [k, value] of Object.entries(query)) {
    if (k === 'api_key') continue
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(k, String(v)))
    } else {
      search.set(k, String(value))
    }
  }
  search.set('api_key', key)
  return `https://api.themoviedb.org/3/${clean}?${search.toString()}`
}

export async function tmdbFetch<T = unknown>(
  path: string,
  query: Record<string, unknown> = {}
): Promise<T> {
  const url = buildTmdbUrl(path, query)
  try {
    return await $fetch<T>(url)
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
}
