<template>
  <div>
    <SkeletonDetailPage v-if="pending && !episode" variant="episode" :show-gallery="false" :show-extra-block="false" />

    <div v-else-if="errorMsg && !episode" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this episode</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink :to="seasonHref" class="btn-ghost">Back to season</NuxtLink>
    </div>

    <div v-else-if="episode" class="episode-page pb-16">
      <header class="relative w-full overflow-hidden min-h-[16rem] sm:min-h-[20rem]">
        <div class="absolute inset-0 bg-cover bg-center scale-105" :style="backdropImgPath" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-900/50" />

        <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <nav class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-6">
            <NuxtLink :to="'/tv/' + tvId" class="hover:text-indigo-200 transition-colors">{{ showName || 'Show' }}</NuxtLink>
            <span class="text-slate-600" aria-hidden="true">/</span>
            <NuxtLink :to="seasonHref" class="hover:text-indigo-200 transition-colors">Season {{ seasonNum }}</NuxtLink>
            <span class="text-slate-600" aria-hidden="true">/</span>
            <span class="text-slate-300">Episode {{ episode.episode_number }}</span>
          </nav>

          <div class="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            <div class="w-full max-w-xl lg:max-w-md shrink-0 mx-auto lg:mx-0">
              <div class="rounded-2xl overflow-hidden aspect-video bg-slate-900 ring-1 ring-white/10 shadow-2xl shadow-black/40">
                <img
                  v-if="stillSrc"
                  :src="stillSrc"
                  :alt="episode.name"
                  class="w-full h-full object-cover"
                />
                <img
                  v-else
                  src="@/assets/img/noPoster.png"
                  alt=""
                  class="w-full h-full object-cover opacity-50"
                />
              </div>
            </div>

            <div class="flex-1 min-w-0 text-center lg:text-left">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
                S{{ seasonNum }} · E{{ episode.episode_number }}
              </p>
              <h1 class="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-lg">
                {{ episode.name || 'Untitled episode' }}
              </h1>
              <div class="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
                <span
                  v-if="episode.air_date"
                  class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
                >{{ episode.air_date }}</span>
                <span
                  v-if="episode.runtime"
                  class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
                >{{ episode.runtime }} min</span>
                <UIRatingBadge
                  v-if="episode.vote_average"
                  :vote-average="episode.vote_average"
                  :vote-count="episode.vote_count"
                  :force="true"
                  size="md"
                  class="!rounded-full"
                />
              </div>

              <!-- Prev / next within season -->
              <div class="mt-6 flex flex-wrap justify-center lg:justify-start gap-2">
                <NuxtLink
                  v-if="prevEpisode"
                  :to="episodeHref(prevEpisode)"
                  class="rounded-full px-4 py-2 text-xs font-semibold bg-slate-900/80 text-slate-200 ring-1 ring-slate-600 hover:ring-indigo-400/40 transition-colors"
                >
                  ← E{{ prevEpisode.episode_number }} {{ prevEpisode.name }}
                </NuxtLink>
                <NuxtLink
                  v-if="nextEpisode"
                  :to="episodeHref(nextEpisode)"
                  class="rounded-full px-4 py-2 text-xs font-semibold bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-400/30 hover:bg-indigo-500/30 transition-colors"
                >
                  E{{ nextEpisode.episode_number }} {{ nextEpisode.name }} →
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        <section class="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div class="lg:col-span-2 space-y-6 min-w-0">
            <div class="section-card">
              <h2 class="text-xl font-bold text-slate-100">Overview</h2>
              <p class="mt-3 text-slate-300 leading-relaxed text-sm sm:text-base">
                {{ episode.overview || 'No overview on TMDB for this episode.' }}
              </p>
            </div>

            <div v-if="guestStars.length" class="section-card scrollbar overflow-x-auto">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Guest stars</h2>
              <TvCast :cast="guestStars" />
            </div>

            <div v-if="cast.length" class="section-card scrollbar overflow-x-auto">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Series cast</h2>
              <TvCast :cast="cast" />
            </div>

            <div v-if="crew.length" class="section-card scrollbar overflow-x-auto">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Crew</h2>
              <TvCast :cast="crew" />
            </div>
          </div>

          <aside class="space-y-6 min-w-0 lg:sticky lg:top-20">
            <div class="section-card space-y-4">
              <h2 class="text-xl font-bold text-slate-100">Episode info</h2>
              <UIRatingPanel
                :vote-average="episode.vote_average"
                :vote-count="episode.vote_count"
              />
              <dl class="space-y-2 text-sm text-slate-300">
                <div class="flex justify-between gap-3">
                  <dt class="text-slate-500">Episode</dt>
                  <dd>S{{ seasonNum }}E{{ episode.episode_number }}</dd>
                </div>
                <div v-if="episode.air_date" class="flex justify-between gap-3">
                  <dt class="text-slate-500">Air date</dt>
                  <dd>{{ episode.air_date }}</dd>
                </div>
                <div v-if="episode.runtime" class="flex justify-between gap-3">
                  <dt class="text-slate-500">Runtime</dt>
                  <dd>{{ episode.runtime }} min</dd>
                </div>
              </dl>
              <NuxtLink :to="seasonHref" class="btn-secondary !bg-slate-900 inline-flex text-sm w-full justify-center">
                Back to season
              </NuxtLink>
              <NuxtLink :to="'/tv/' + tvId" class="btn-ghost text-center block text-sm">
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
const {
  getTv,
  getTvEpisode,
  getTvSeason,
  getTvCredits,
  backdropStyle,
  imageUrl,
} = useTmdb()

function paramOne(v: string | string[] | undefined): string {
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
}

const tvId = computed(() => paramOne(route.params.tvid))
const seasonNum = computed(() => paramOne(route.params.seasonnum))
const episodeNum = computed(() => paramOne(route.params.episodenum))
const seasonHref = computed(() => `/tv/${tvId.value}/season/${seasonNum.value}`)

function episodeHref(ep: { episode_number: number }) {
  return `/tv/${tvId.value}/season/${seasonNum.value}/episode/${ep.episode_number}`
}

const {
  data: bundle,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `tv-ep-${tvId.value}-${seasonNum.value}-${episodeNum.value}`,
  async () => {
    const [show, ep, seasonData] = await Promise.all([
      getTv(tvId.value).catch(() => null),
      getTvEpisode(tvId.value, seasonNum.value, episodeNum.value),
      getTvSeason(tvId.value, seasonNum.value).catch(() => null),
    ])
    let seriesCast: any[] = []
    try {
      const credits = await getTvCredits(tvId.value)
      seriesCast = credits.cast || []
    }
    catch {
      seriesCast = []
    }
    return { show, episode: ep, season: seasonData, seriesCast }
  },
  { watch: [tvId, seasonNum, episodeNum] },
)

const episode = computed(() => bundle.value?.episode || null)
const showName = computed(() => bundle.value?.show?.name || null)
const seasonEpisodes = computed(() => bundle.value?.season?.episodes || [])
const cast = computed(() => bundle.value?.seriesCast || [])
const guestStars = computed(() => episode.value?.guest_stars || [])
const crew = computed(() => episode.value?.crew || [])

const stillSrc = computed(() => imageUrl(episode.value?.still_path, 'w780'))
const backdropImgPath = computed(() =>
  backdropStyle(
    episode.value?.still_path
    || bundle.value?.show?.backdrop_path
    || null,
  ),
)

const currentIndex = computed(() => {
  const n = Number(episode.value?.episode_number)
  return seasonEpisodes.value.findIndex((e: any) => Number(e.episode_number) === n)
})
const prevEpisode = computed(() => {
  const i = currentIndex.value
  if (i <= 0) return null
  return seasonEpisodes.value[i - 1] || null
})
const nextEpisode = computed(() => {
  const i = currentIndex.value
  if (i < 0 || i >= seasonEpisodes.value.length - 1) return null
  return seasonEpisodes.value[i + 1] || null
})

const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

const pageTitle = computed(() => {
  const ep = episode.value
  if (!ep) return 'Episode · Orbitra'
  const show = showName.value
  const label = `${ep.episode_number}. ${ep.name || 'Episode'}`
  return show ? `${show} · S${seasonNum.value}E${ep.episode_number} · Orbitra` : `${label} · Orbitra`
})

useSeoMeta({
  title: pageTitle,
  description: computed(() =>
    (episode.value?.overview || '').slice(0, 160) || 'Episode details on Orbitra',
  ),
  ogImage: computed(() => stillSrc.value || undefined),
  twitterCard: 'summary_large_image',
})
</script>
