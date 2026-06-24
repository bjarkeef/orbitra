/**
 * Client-safe TMDB access via Nitro proxy (/api/tmdb/*).
 * Never pass or store the TMDB API key in the browser.
 */
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function useTmdb() {
  const apiBase = '/api/tmdb'

  function pathUrl(path: string) {
    const clean = path.replace(/^\/+/, '')
    return `${apiBase}/${clean}`
  }

  /** GET a TMDB v3 resource through the server proxy */
  async function tmdb<T = any>(path: string, query: Record<string, any> = {}) {
    return await $fetch<T>(pathUrl(path), { query })
  }

  function imageUrl(
    filePath: string | null | undefined,
    size:
      | 'w185'
      | 'w300'
      | 'w500'
      | 'w780'
      | 'original'
      | 'w1920_and_h800_multi_faces'
      | 'w300_and_h300_bestv2' = 'w500'
  ) {
    if (!filePath) return ''
    const file = filePath.startsWith('/') ? filePath.slice(1) : filePath
    return `${IMAGE_BASE}/${size}/${file}`
  }

  function backdropStyle(filePath: string | null | undefined) {
    const url = imageUrl(filePath, 'w1920_and_h800_multi_faces')
    return url ? { backgroundImage: `url(${url})` } : { backgroundImage: '' }
  }

  const getTrending = (media: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', page = 1) =>
    tmdb(`trending/${media}/${timeWindow}`, { page })

  const getNowPlaying = (page = 1) => tmdb('movie/now_playing', { page })

  const getMovie = (id: string | number, extras: Record<string, any> = {}) =>
    tmdb(`movie/${id}`, extras)

  const getMovieCredits = (id: string | number) => tmdb(`movie/${id}/credits`)

  const getMovieProviders = (id: string | number) => tmdb(`movie/${id}/watch/providers`)

  const getMovieVideos = (id: string | number) => tmdb(`movie/${id}/videos`)

  const getTv = (id: string | number, extras: Record<string, any> = {}) =>
    tmdb(`tv/${id}`, extras)

  const getTvCredits = (id: string | number) => tmdb(`tv/${id}/credits`)

  const getTvSeason = (tvId: string | number, seasonNum: string | number) =>
    tmdb(`tv/${tvId}/season/${seasonNum}`)

  const getTvEpisode = (
    tvId: string | number,
    seasonNum: string | number,
    episodeNum: string | number
  ) => tmdb(`tv/${tvId}/season/${seasonNum}/episode/${episodeNum}`)

  const getPerson = (id: string | number) => tmdb(`person/${id}`)

  const getPersonCombinedCredits = (id: string | number) =>
    tmdb(`person/${id}/combined_credits`)

  const getCollection = (id: string | number) => tmdb(`collection/${id}`)

  const searchMulti = (query: string, opts: { page?: number; include_adult?: boolean } = {}) =>
    tmdb('search/multi', {
      query,
      page: opts.page ?? 1,
      include_adult: opts.include_adult ?? false,
    })

  const getTopRatedMovies = (page = 1) => tmdb('movie/top_rated', { page })

  const getTopRatedTv = (page = 1) => tmdb('tv/top_rated', { page })

  const getPopularMovies = (page = 1) => tmdb('movie/popular', { page })

  const discoverMovies = (page = 1) =>
    tmdb('discover/movie', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 250,
      page,
    })

  const discoverTv = (page = 1) =>
    tmdb('discover/tv', {
      sort_by: 'popularity.desc',
      'vote_count.gte': 250,
      page,
    })

  const getTvExternalIds = (id: string | number) => tmdb(`tv/${id}/external_ids`)

  const getCreditsForTitle = (mediaType: 'movie' | 'tv', id: string | number) =>
    tmdb(`${mediaType}/${id}/credits`)

  return {
    apiBase,
    pathUrl,
    tmdb,
    imageUrl,
    backdropStyle,
    getTrending,
    getNowPlaying,
    getMovie,
    getMovieCredits,
    getMovieProviders,
    getMovieVideos,
    getTv,
    getTvCredits,
    getTvSeason,
    getTvEpisode,
    getPerson,
    getPersonCombinedCredits,
    getCollection,
    searchMulti,
    getTopRatedMovies,
    getTopRatedTv,
    getPopularMovies,
    discoverMovies,
    discoverTv,
    getTvExternalIds,
    getCreditsForTitle,
  }
}