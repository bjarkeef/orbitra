<template>
  <div>
    <SkeletonDetailPage v-if="pending && !tv" />

    <div v-else-if="errorMsg && !tv" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this show</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="tv" class="tv pb-8">
      <div
        class="media-banner"
        :style="backdropImgPath"
      />
      <div class="detail-panel">
        <div class="w-full gap-6 flex xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full" :object="tv" mtype="tv" />
          <Information class="w-2/3 xl:w-full" :object="tv" mtype="tv" />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden min-w-0">
          <div class="flex gap-6">
            <div class="section-card w-full">
              <h1 class="text-3xl sm:text-4xl font-bold mb-2 text-slate-100">
                <template v-if="tv.name === tv.original_name">{{ tv.name }}</template>
                <template v-else-if="tv.original_name">{{ tv.name }} ( {{ tv.original_name }} )</template>
                <template v-else>{{ tv.name }}</template>
              </h1>
              <h4 v-if="tv.tagline" class="text-lg sm:text-xl italic mb-4 text-slate-400">{{ tv.tagline }}</h4>
              <hr class="card-divider" />
              <p class="text-slate-300 leading-relaxed">{{ tv.overview }}</p>
            </div>
          </div>

          <div v-if="creditsPending && !cast.length" class="section-card mt-6">
            <div class="h-6 w-20 rounded bg-slate-700/70 animate-pulse mb-4" />
            <div class="flex gap-3 overflow-hidden">
              <div v-for="n in 6" :key="n" class="shrink-0 w-20 aspect-poster rounded-md bg-slate-700/60 animate-pulse" />
            </div>
          </div>
          <template v-else>
            <div v-if="cast.length" class="section-card scrollbar mt-6 overflow-x-auto">
              <h3 class="mb-4 text-2xl font-bold text-slate-100">Cast</h3>
              <TvCast :cast="cast" />
            </div>
            <div v-if="crew.length" class="section-card scrollbar mt-6 overflow-x-auto">
              <h3 class="mb-4 text-2xl font-bold text-slate-100">Crew</h3>
              <TvCast :cast="crew" />
            </div>
          </template>

          <div v-if="tv.seasons" class="seasons mt-6">
            <h3 class="text-2xl mb-3 font-bold text-slate-100">Seasons</h3>
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
                  <h3 class="text-lg sm:text-xl mb-2 font-bold text-slate-100">{{ season.name }}</h3>
                  <p class="text-sm mb-2 text-slate-400 line-clamp-3">{{ season.overview }}</p>
                  <p class="text-sm text-slate-500">Episodes: {{ season.episode_count }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getTv, getTvCredits, backdropStyle, imageUrl } = useTmdb()

const id = computed(() => String(route.params.tvid))

const {
  data: tv,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `tv-${id.value}`,
  () => getTv(id.value),
  { watch: [id] },
)

const {
  data: credits,
  pending: creditsPending,
} = useLazyAsyncData(
  () => `tv-credits-${id.value}`,
  async () => {
    const res = await getTvCredits(id.value).catch(() => ({ cast: [], crew: [] }))
    return { cast: res.cast || [], crew: res.crew || [] }
  },
  { watch: [id] },
)

const cast = computed(() => credits.value?.cast || [])
const crew = computed(() => credits.value?.crew || [])
const backdropImgPath = computed(() => backdropStyle(tv.value?.backdrop_path))
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

function seasonPoster(season) {
  return imageUrl(season?.poster_path, 'w500')
}
</script>
