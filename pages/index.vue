<template>
  <div class="home pb-16">
    <HomeHero />
    <div class="space-y-14 mt-10">
      <HomeOrbitSpotlight />
      <HomeRail
        title="Trending this week"
        subtitle="What people are watching right now"
        :items="trending"
        :loading="pendingTrending"
        :error="errTrending"
        @retry="refreshTrending"
      />
      <HomeRail
        title="Coming soon"
        subtitle="Movies on the TMDB upcoming calendar"
        :items="upcoming"
        media-type="movie"
        :loading="pendingUpcoming"
        :error="errUpcoming"
        @retry="refreshUpcoming"
      />
      <HomeRail
        title="On the air"
        subtitle="TV series with recent or upcoming episodes"
        :items="onTheAir"
        media-type="tv"
        :loading="pendingOnAir"
        :error="errOnAir"
        @retry="refreshOnAir"
      />
      <HomeRail
        title="Airing today"
        subtitle="Episodes scheduled for today"
        :items="airingToday"
        media-type="tv"
        :loading="pendingAiring"
        :error="errAiring"
        @retry="refreshAiring"
      />
      <HomeRail
        title="Popular movies"
        subtitle="Crowd favorites in theatres and at home"
        :items="popularMovies"
        media-type="movie"
        :loading="pendingMovies"
        :error="errMovies"
        @retry="refreshMovies"
      />
      <HomeRail
        title="Popular TV"
        subtitle="Series with momentum"
        :items="popularTv"
        media-type="tv"
        :loading="pendingTv"
        :error="errTv"
        @retry="refreshTv"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  getTrending,
  discoverMovies,
  discoverTv,
  getUpcomingMovies,
  getOnTheAir,
  getAiringToday,
  withMediaType,
} = useTmdb()

const {
  data: trendingData,
  pending: pendingTrending,
  error: trendingError,
  refresh: refreshTrending,
} = useLazyAsyncData('home-trending', async () => {
  const res = await getTrending('all', 'week', 1)
  return res.results || []
})

const {
  data: upcomingData,
  pending: pendingUpcoming,
  error: upcomingError,
  refresh: refreshUpcoming,
} = useLazyAsyncData('home-upcoming', async () => {
  const res = await getUpcomingMovies(1)
  return withMediaType(res.results, 'movie')
})

const {
  data: onAirData,
  pending: pendingOnAir,
  error: onAirError,
  refresh: refreshOnAir,
} = useLazyAsyncData('home-on-the-air', async () => {
  const res = await getOnTheAir(1)
  return withMediaType(res.results, 'tv')
})

const {
  data: airingData,
  pending: pendingAiring,
  error: airingError,
  refresh: refreshAiring,
} = useLazyAsyncData('home-airing-today', async () => {
  const res = await getAiringToday(1)
  return withMediaType(res.results, 'tv')
})

const {
  data: moviesData,
  pending: pendingMovies,
  error: moviesError,
  refresh: refreshMovies,
} = useLazyAsyncData('home-popular-movies', async () => {
  const res = await discoverMovies(1)
  return res.results || []
})

const {
  data: tvData,
  pending: pendingTv,
  error: tvError,
  refresh: refreshTv,
} = useLazyAsyncData('home-popular-tv', async () => {
  const res = await discoverTv(1)
  return res.results || []
})

const trending = computed(() => trendingData.value || [])
const upcoming = computed(() => upcomingData.value || [])
const onTheAir = computed(() => onAirData.value || [])
const airingToday = computed(() => airingData.value || [])
const popularMovies = computed(() => moviesData.value || [])
const popularTv = computed(() => tvData.value || [])

const errTrending = computed(() => errMsg(trendingError.value))
const errUpcoming = computed(() => errMsg(upcomingError.value))
const errOnAir = computed(() => errMsg(onAirError.value))
const errAiring = computed(() => errMsg(airingError.value))
const errMovies = computed(() => errMsg(moviesError.value))
const errTv = computed(() => errMsg(tvError.value))

function errMsg(e: { statusMessage?: string, message?: string } | null | undefined): string | undefined {
  if (!e) return undefined
  return e.statusMessage || e.message || 'Something went wrong'
}
</script>
