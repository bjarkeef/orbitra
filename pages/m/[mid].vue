<template>
  <div>
    <SkeletonDetailPage v-if="pending && !movie" />

    <div v-else-if="errorMsg && !movie" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this movie</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="movie" class="title-page pb-16">
      <UITitleHero
        kind-label="Movie"
        :title="movie.title"
        :tagline="movie.tagline"
        :poster-url="posterUrl"
        :backdrop-style="backdropImgPath"
      >
        <template #badges>
          <span
            v-if="year"
            class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
          >{{ year }}</span>
          <span
            v-if="movie.vote_average"
            class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
          >★ {{ movie.vote_average.toFixed(1) }}<span v-if="movie.vote_count" class="text-slate-400"> · {{ formatVotes(movie.vote_count) }}</span></span>
          <span
            v-if="runtimeLabel"
            class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
          >{{ runtimeLabel }}</span>
          <span
            v-for="g in (movie.genres || []).slice(0, 4)"
            :key="g.id"
            class="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-indigo-400/25"
          >{{ g.name }}</span>
        </template>
      </UITitleHero>

      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-4 relative z-10 space-y-8">
        <section class="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div class="lg:col-span-2 space-y-6 min-w-0">
            <div class="section-card">
              <h2 class="text-xl font-bold text-slate-100">Overview</h2>
              <p class="mt-3 text-slate-300 leading-relaxed text-sm sm:text-base">
                {{ movie.overview || 'No overview on TMDB for this title.' }}
              </p>
            </div>

            <UITrailerSection :videos="videos" />

            <UIMediaGallery
              v-if="galleryImages"
              title="Images"
              subtitle="Backdrops & posters from TMDB"
              :images="galleryImages"
              prefer="auto"
            />

            <div v-if="pending && !cast.length" class="section-card">
              <div class="h-6 w-24 rounded bg-slate-700/70 animate-pulse mb-4" />
              <div class="flex gap-3 overflow-hidden">
                <div v-for="n in 6" :key="n" class="shrink-0 w-20 aspect-poster rounded-md bg-slate-700/60 animate-pulse" />
              </div>
            </div>
            <div v-else-if="cast.length" class="section-card scrollbar overflow-x-auto">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Cast</h2>
              <CastRail :cast="cast" sort-by-popularity />
            </div>

            <MCollection v-if="movie.belongs_to_collection" :movie="movie" />
          </div>

          <aside class="space-y-6 min-w-0 lg:sticky lg:top-20">
            <Information mtype="movie" :object="movie" />
            <div
              v-if="providers?.results && Object.keys(providers.results).length"
              class="section-card"
            >
              <h2 class="text-xl font-bold text-slate-100 mb-1">Where to watch</h2>
              <p class="text-xs text-slate-500 mb-4">Availability via TMDB / JustWatch</p>
              <MProviders :providers="providers" />
            </div>
            <div
              v-else-if="pending"
              class="h-28 rounded-lg bg-slate-800/80 animate-pulse"
            />
          </aside>
        </section>
      </div>

      <div
        v-if="pending || recommendations.length || similar.length"
        class="space-y-12 mt-12"
      >
        <HomeRail
          v-if="pending || recommendations.length"
          title="Recommended"
          subtitle="Titles TMDB suggests based on this movie"
          :items="recommendations"
          media-type="movie"
          :loading="pending && !recommendations.length"
          @retry="refresh()"
        />
        <HomeRail
          v-if="pending || similar.length"
          title="More like this"
          subtitle="Similar movies from TMDB"
          :items="similar"
          media-type="movie"
          :loading="pending && !similar.length"
          @retry="refresh()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const {
  getMovieDetailed,
  getMovieProviders,
  withMediaType,
  backdropStyle,
  imageUrl,
} = useTmdb()

const id = computed(() => String(route.params.mid))

const {
  data: bundle,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `movie-detail-${id.value}`,
  async () => {
    const mid = id.value
    const [detailed, providers] = await Promise.all([
      getMovieDetailed(mid),
      getMovieProviders(mid).catch(() => null),
    ])
    return { detailed, providers }
  },
  { watch: [id] },
)

const movie = computed(() => bundle.value?.detailed || null)
const cast = computed(() => bundle.value?.detailed?.credits?.cast || [])
const providers = computed(() => bundle.value?.providers || null)
const galleryImages = computed(() => bundle.value?.detailed?.images || null)
const videos = computed(() => bundle.value?.detailed?.videos || null)
const recommendations = computed(() =>
  withMediaType(bundle.value?.detailed?.recommendations?.results, 'movie'),
)
const similar = computed(() =>
  withMediaType(bundle.value?.detailed?.similar?.results, 'movie'),
)
const backdropImgPath = computed(() =>
  backdropStyle(movie.value?.backdrop_path, movie.value?.poster_path),
)
const posterUrl = computed(() => imageUrl(movie.value?.poster_path, 'w500'))
const year = computed(() => (movie.value?.release_date || '').slice(0, 4) || null)

function formatVotes(n: number) {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}
const runtimeLabel = computed(() => {
  const r = movie.value?.runtime
  if (!r) return null
  const h = Math.floor(r / 60)
  const m = r % 60
  return h ? `${h}h ${m}m` : `${m}m`
})
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

const pageTitle = computed(() => {
  const m = movie.value
  if (!m) return 'Movie · Orbitra'
  const y = (m.release_date || '').slice(0, 4)
  return y ? `${m.title} (${y}) · Orbitra` : `${m.title} · Orbitra`
})

const pageDescription = computed(() => {
  const overview = movie.value?.overview?.trim()
  if (overview) return overview.slice(0, 160)
  return movie.value?.title
    ? `Details, cast, and where to watch ${movie.value.title} on Orbitra.`
    : 'Movie details on Orbitra.'
})

const ogImage = computed(() =>
  imageUrl(movie.value?.backdrop_path || movie.value?.poster_path, 'w780') || undefined,
)

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage,
  twitterCard: 'summary_large_image',
})
</script>
