<template>
  <div>
    <SkeletonDetailPage v-if="pending && !season" :show-gallery="false" />

    <div v-else-if="errorMsg && !season" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this season</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink :to="'/tv/' + tvId" class="btn-ghost">Back to show</NuxtLink>
    </div>

    <div v-else-if="season" class="season-page pb-16">
      <header class="relative w-full overflow-hidden min-h-[18rem] sm:min-h-[22rem]">
        <div class="absolute inset-0 bg-cover bg-center scale-105" :style="backdropImgPath" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-transparent" />

        <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-8 pb-10 flex flex-col sm:flex-row gap-8 items-end min-h-[18rem] sm:min-h-[22rem]">
          <div class="shrink-0 w-32 sm:w-40 md:w-44 mx-auto sm:mx-0">
            <div class="rounded-2xl overflow-hidden aspect-[2/3] bg-slate-900 ring-1 ring-white/10 shadow-2xl shadow-black/50">
              <img
                v-if="seasonPosterSrc"
                :src="seasonPosterSrc"
                :alt="season.name"
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
            <NuxtLink
              :to="'/tv/' + tvId"
              class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90 hover:text-indigo-200 transition-colors"
            >
              {{ showName || 'TV series' }}
            </NuxtLink>
            <h1 class="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
              {{ season.name }}
            </h1>
            <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                v-if="season.season_number != null"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >Season {{ season.season_number }}</span>
              <span
                v-if="episodeCount"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >{{ episodeCount }} episode{{ episodeCount === 1 ? '' : 's' }}</span>
              <span
                v-if="season.air_date"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >{{ String(season.air_date).slice(0, 4) }}</span>
              <UIRatingBadge
                v-if="season.vote_average"
                :vote-average="season.vote_average"
                :vote-count="season.vote_count"
                :force="true"
                size="md"
                class="!rounded-full"
              />
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
                {{ season.overview || 'No overview on TMDB for this season.' }}
              </p>
            </div>

            <div v-if="extrasPending && !cast.length" class="section-card">
              <div class="h-6 w-24 rounded bg-slate-700/70 animate-pulse mb-4" />
              <div class="flex gap-3 overflow-hidden">
                <div v-for="n in 6" :key="n" class="shrink-0 w-20 aspect-poster rounded-md bg-slate-700/60 animate-pulse" />
              </div>
            </div>
            <div v-else-if="cast.length" class="section-card scrollbar overflow-x-auto">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Season cast</h2>
              <TvCast :cast="cast" />
            </div>

            <div v-if="season.episodes?.length" class="section-card">
              <h2 class="text-xl font-bold text-slate-100 mb-1">Episodes</h2>
              <p class="text-xs text-slate-500 mb-4">{{ episodeCount }} in this season</p>
              <TvEpisodes :tv="tvId" :season="season" />
            </div>
          </div>

          <aside class="space-y-6 min-w-0 lg:sticky lg:top-20">
            <div class="section-card space-y-4">
              <h2 class="text-xl font-bold text-slate-100">Season info</h2>
              <UIRatingPanel
                :vote-average="season.vote_average"
                :vote-count="season.vote_count"
              />
              <dl class="space-y-2 text-sm text-slate-300">
                <div v-if="season.air_date" class="flex justify-between gap-3">
                  <dt class="text-slate-500">First aired</dt>
                  <dd>{{ season.air_date }}</dd>
                </div>
                <div v-if="episodeCount" class="flex justify-between gap-3">
                  <dt class="text-slate-500">Episodes</dt>
                  <dd>{{ episodeCount }}</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500">Season #</dt>
                  <dd>{{ season.season_number }}</dd>
                </div>
              </dl>
              <NuxtLink :to="'/tv/' + tvId" class="btn-secondary !bg-slate-900 inline-flex text-sm w-full justify-center">
                Back to show
              </NuxtLink>
            </div>
          </aside>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getTv, getTvSeason, getTvSeasonCredits, backdropStyle, imageUrl } = useTmdb()

function paramOne(v: string | string[] | undefined): string {
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
}

const tvId = computed(() => paramOne(route.params.tvid))
const seasonNum = computed(() => paramOne(route.params.seasonnum))

const {
  data: bundle,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `tv-season-${tvId.value}-${seasonNum.value}`,
  async () => {
    const [show, seasonData] = await Promise.all([
      getTv(tvId.value).catch(() => null),
      getTvSeason(tvId.value, seasonNum.value),
    ])
    let cast: any[] = []
    try {
      const credits = await getTvSeasonCredits(tvId.value, seasonNum.value)
      cast = credits.cast || []
    }
    catch {
      cast = []
    }
    return { show, season: seasonData, cast }
  },
  { watch: [tvId, seasonNum] },
)

const season = computed(() => bundle.value?.season || null)
const showName = computed(() => bundle.value?.show?.name || null)
const cast = computed(() => bundle.value?.cast || [])
const extrasPending = computed(() => pending.value && !cast.value.length)

const seasonPosterSrc = computed(() => imageUrl(season.value?.poster_path, 'w500'))
const backdropImgPath = computed(() =>
  backdropStyle(
    bundle.value?.show?.backdrop_path || season.value?.poster_path || null,
  ),
)
const episodeCount = computed(() => season.value?.episodes?.length || season.value?.episode_count || 0)
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

const pageTitle = computed(() => {
  const s = season.value
  if (!s) return 'Season · Orbitra'
  const show = showName.value
  return show ? `${show} · ${s.name} · Orbitra` : `${s.name} · Orbitra`
})

useSeoMeta({
  title: pageTitle,
  description: computed(() =>
    (season.value?.overview || '').slice(0, 160)
    || `Season details on Orbitra`,
  ),
  ogImage: computed(() => seasonPosterSrc.value || undefined),
  twitterCard: 'summary_large_image',
})
</script>
