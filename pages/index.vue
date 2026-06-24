<template>
  <div class="home pb-16">
    <HomeHero />
    <div class="space-y-14 mt-10">
      <HomeRail
        title="Trending this week"
        subtitle="What people are watching right now"
        :items="trending"
        :loading="pendingTrending"
        :error="errTrending"
        @retry="refreshTrending"
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

<script setup>
const { getTrending, discoverMovies, discoverTv } = useTmdb()

// Lazy: layout + hero/rails mount immediately with skeletons (no nav block)
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
const popularMovies = computed(() => moviesData.value || [])
const popularTv = computed(() => tvData.value || [])

const errTrending = computed(() => errMsg(trendingError.value))
const errMovies = computed(() => errMsg(moviesError.value))
const errTv = computed(() => errMsg(tvError.value))

function errMsg(e) {
  if (!e) return null
  return e.statusMessage || e.message || 'Something went wrong'
}
</script>
