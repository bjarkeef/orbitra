<template>
  <div>
    <SkeletonDetailPage v-if="pending && !tv" />

    <div v-else-if="errorMsg && !tv" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this show</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="tv" class="title-page pb-16">
      <header class="relative w-full overflow-hidden min-h-[20rem] sm:min-h-[24rem]">
        <div class="absolute inset-0 bg-cover bg-center scale-105" :style="backdropImgPath" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-transparent" />

        <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-10 pb-12 flex flex-col sm:flex-row gap-8 items-end min-h-[20rem] sm:min-h-[24rem]">
          <div class="shrink-0 w-36 sm:w-44 md:w-48 mx-auto sm:mx-0">
            <div class="rounded-2xl overflow-hidden aspect-[2/3] bg-slate-900 ring-1 ring-white/10 shadow-2xl shadow-black/50">
              <img
                v-if="posterUrl"
                :src="posterUrl"
                :alt="tv.name"
                class="w-full h-full object-cover"
              />
              <img
                v-else
                src="@/assets/img/noPoster.png"
                alt=""
                class="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>

          <div class="flex-1 min-w-0 text-center sm:text-left pb-1">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">TV series</p>
            <h1 class="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
              <template v-if="tv.name === tv.original_name || !tv.original_name">{{ tv.name }}</template>
              <template v-else>{{ tv.name }} <span class="text-slate-400 font-bold text-2xl sm:text-3xl">({{ tv.original_name }})</span></template>
            </h1>
            <p v-if="tv.tagline" class="mt-2 text-sm sm:text-base italic text-slate-300/90 max-w-2xl">
              {{ tv.tagline }}
            </p>

            <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                v-if="year"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >{{ year }}</span>
              <span
                v-if="tv.vote_average"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >★ {{ tv.vote_average.toFixed(1) }}<span v-if="tv.vote_count" class="text-slate-400"> · {{ formatVotes(tv.vote_count) }}</span></span>
              <span
                v-if="tv.status"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >{{ tv.status }}</span>
              <span
                v-if="tv.number_of_seasons"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >{{ tv.number_of_seasons }} season{{ tv.number_of_seasons === 1 ? '' : 's' }}</span>
              <span
                v-for="g in (tv.genres || []).slice(0, 4)"
                :key="g.id"
                class="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-indigo-400/25"
              >{{ g.name }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-4 relative z-10 space-y-8">
        <section class="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div class="lg:col-span-2 space-y-6 min-w-0">
            <div class="section-card">
              <h2 class="text-xl font-bold text-slate-100">Overview</h2>
              <p class="mt-3 text-slate-300 leading-relaxed text-sm sm:text-base">
                {{ tv.overview || 'No overview on TMDB for this show.' }}
              </p>
            </div>

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
            <template v-else>
              <div v-if="cast.length" class="section-card scrollbar overflow-x-auto">
                <h2 class="text-xl font-bold text-slate-100 mb-4">Cast</h2>
                <TvCast :cast="cast" />
              </div>
              <div v-if="crew.length" class="section-card scrollbar overflow-x-auto">
                <h2 class="text-xl font-bold text-slate-100 mb-4">Crew</h2>
                <TvCast :cast="crew" />
              </div>
            </template>

            <div v-if="tv.seasons?.length" class="section-card">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Seasons</h2>
              <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
                <NuxtLink
                  v-for="season in tv.seasons"
                  :key="season.id"
                  class="list-card"
                  :to="'/tv/' + tv.id + '/season/' + season.season_number"
                >
                  <div class="w-1/3 shrink-0">
                    <img
                      v-if="seasonPoster(season)"
                      :src="seasonPoster(season)"
                      :alt="season.name"
                      class="rounded-md w-full bg-slate-900"
                      loading="lazy"
                    />
                    <img
                      v-else
                      class="bg-slate-900 rounded-md w-full"
                      src="@/assets/img/noPoster.png"
                      alt="No Poster"
                    />
                  </div>
                  <div class="w-2/3 min-w-0">
                    <h3 class="text-lg font-bold text-slate-100">{{ season.name }}</h3>
                    <p class="text-sm mb-2 text-slate-400 line-clamp-3">{{ season.overview }}</p>
                    <p class="text-sm text-slate-500">Episodes: {{ season.episode_count }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>

          <aside class="space-y-6 min-w-0 lg:sticky lg:top-20">
            <Information :object="tv" mtype="tv" />
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
          subtitle="Shows TMDB suggests based on this series"
          :items="recommendations"
          media-type="tv"
          :loading="pending && !recommendations.length"
          @retry="refresh()"
        />
        <HomeRail
          v-if="pending || similar.length"
          title="More like this"
          subtitle="Similar shows from TMDB"
          :items="similar"
          media-type="tv"
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
  getTvDetailed,
  getTvProviders,
  withMediaType,
  backdropStyle,
  imageUrl,
} = useTmdb()

const id = computed(() => String(route.params.tvid))

const {
  data: bundle,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `tv-detail-${id.value}`,
  async () => {
    const tvid = id.value
    const [detailed, providers] = await Promise.all([
      getTvDetailed(tvid),
      getTvProviders(tvid).catch(() => null),
    ])
    return { detailed, providers }
  },
  { watch: [id] },
)

const tv = computed(() => bundle.value?.detailed || null)
const cast = computed(() => bundle.value?.detailed?.credits?.cast || [])
const crew = computed(() => bundle.value?.detailed?.credits?.crew || [])
const providers = computed(() => bundle.value?.providers || null)
const galleryImages = computed(() => bundle.value?.detailed?.images || null)
const recommendations = computed(() =>
  withMediaType(bundle.value?.detailed?.recommendations?.results, 'tv'),
)
const similar = computed(() =>
  withMediaType(bundle.value?.detailed?.similar?.results, 'tv'),
)
const backdropImgPath = computed(() =>
  backdropStyle(tv.value?.backdrop_path, tv.value?.poster_path),
)
const posterUrl = computed(() => imageUrl(tv.value?.poster_path, 'w500'))
const year = computed(() => (tv.value?.first_air_date || '').slice(0, 4) || null)

function formatVotes(n: number) {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

function seasonPoster(season: { poster_path?: string | null }) {
  return imageUrl(season?.poster_path, 'w500')
}

const pageTitle = computed(() => {
  const t = tv.value
  if (!t) return 'TV · Orbitra'
  const y = (t.first_air_date || '').slice(0, 4)
  return y ? `${t.name} (${y}) · Orbitra` : `${t.name} · Orbitra`
})

const pageDescription = computed(() => {
  const overview = tv.value?.overview?.trim()
  if (overview) return overview.slice(0, 160)
  return tv.value?.name
    ? `Details, seasons, and where to watch ${tv.value.name} on Orbitra.`
    : 'TV details on Orbitra.'
})

const ogImage = computed(() =>
  imageUrl(tv.value?.backdrop_path || tv.value?.poster_path, 'w780') || undefined,
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
