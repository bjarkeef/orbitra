<template>
  <div class="home pb-16">
    <HomeHero />
    <div class="space-y-14 mt-10">
      <HomeOrbitSpotlight />
      <HomeRail
        title="Trending this week"
        subtitle="What people are watching right now"
        :items="trending"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
      <HomeRail
        title="Coming soon"
        subtitle="Movies on the TMDB upcoming calendar"
        :items="upcoming"
        media-type="movie"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
      <HomeRail
        title="On the air"
        subtitle="TV series with recent or upcoming episodes"
        :items="onTheAir"
        media-type="tv"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
      <HomeRail
        title="Airing today"
        subtitle="Episodes scheduled for today"
        :items="airingToday"
        media-type="tv"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
      <HomeRail
        title="Popular movies"
        subtitle="Crowd favorites in theatres and at home"
        :items="popularMovies"
        media-type="movie"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
      <HomeRail
        title="Popular TV"
        subtitle="Series with momentum"
        :items="popularTv"
        media-type="tv"
        :loading="pending"
        :error="err"
        @retry="refresh"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * One payload for all home rails — single useLazyAsyncData key, parallel TMDB
 * fetches inside. Avoids 6 separate payload serializations / hydration entries.
 */
const {
  getTrending,
  discoverMovies,
  discoverTv,
  getUpcomingMovies,
  getOnTheAir,
  getAiringToday,
  withMediaType,
} = useTmdb()

const { data: rails, pending, error, refresh } = useLazyAsyncData('home-rails', async () => {
  const [trendingRes, upcomingRes, onAirRes, airingRes, moviesRes, tvRes] = await Promise.all([
    getTrending('all', 'week', 1),
    getUpcomingMovies(1),
    getOnTheAir(1),
    getAiringToday(1),
    discoverMovies(1),
    discoverTv(1),
  ])
  return {
    trending: trendingRes.results || [],
    upcoming: withMediaType(upcomingRes.results, 'movie'),
    onTheAir: withMediaType(onAirRes.results, 'tv'),
    airingToday: withMediaType(airingRes.results, 'tv'),
    popularMovies: moviesRes.results || [],
    popularTv: tvRes.results || [],
  }
})

const trending = computed(() => rails.value?.trending || [])
const upcoming = computed(() => rails.value?.upcoming || [])
const onTheAir = computed(() => rails.value?.onTheAir || [])
const airingToday = computed(() => rails.value?.airingToday || [])
const popularMovies = computed(() => rails.value?.popularMovies || [])
const popularTv = computed(() => rails.value?.popularTv || [])

const err = computed(() => {
  const e = error.value as { statusMessage?: string, message?: string } | null
  if (!e) return undefined
  return e.statusMessage || e.message || 'Something went wrong'
})
</script>
