<template>
  <div>
    <SkeletonDetailPage v-if="pending && !tv" />

    <div v-else-if="errorMsg && !tv" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this show</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="underline text-indigo-400 mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>

    <div v-else-if="tv" class="tv pb-5">
      <div
        class="banner bg-cover bg-no-repeat bg-center relative h-56 sm:h-72 md:h-96"
        :style="backdropImgPath"
      />
      <div
        class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg"
      >
        <div class="w-full gap-6 flex xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full" :object="tv" mtype="tv" />
          <Information class="w-2/3 xl:w-full" :object="tv" mtype="tv" />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden">
          <div class="flex gap-6">
            <div class="bg-slate-800 w-full rounded-lg p-5">
              <h1 class="text-4xl font-bold mb-2">
                <template v-if="tv.name === tv.original_name">{{ tv.name }}</template>
                <template v-else-if="tv.original_name">{{ tv.name }} ( {{ tv.original_name }} )</template>
                <template v-else>{{ tv.name }}</template>
              </h1>
              <h4 v-if="tv.tagline" class="text-xl italic mb-4">{{ tv.tagline }}</h4>
              <hr class="border-slate-900 border-opacity-50 mb-4" />
              <p>{{ tv.overview }}</p>
            </div>
          </div>

          <div v-if="creditsPending && !cast.length" class="bg-slate-800 rounded-lg p-5 mt-6">
            <div class="h-6 w-20 rounded bg-slate-700/70 animate-pulse mb-4" />
            <div class="flex gap-3 overflow-hidden">
              <div v-for="n in 6" :key="n" class="shrink-0 w-20 aspect-[2/3] rounded-md bg-slate-700/60 animate-pulse" />
            </div>
          </div>
          <template v-else>
            <div v-if="cast.length" class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
              <h3 class="mb-4 text-2xl font-bold">Cast</h3>
              <TvCast :cast="cast" />
            </div>
            <div v-if="crew.length" class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
              <h3 class="mb-4 text-2xl font-bold">Crew</h3>
              <TvCast :cast="crew" />
            </div>
          </template>

          <div v-if="tv.seasons" class="seasons mt-3">
            <h3 class="text-2xl mb-2 font-bold">Seasons</h3>
            <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
              <NuxtLink
                v-for="season in tv.seasons"
                :key="season.id"
                class="bg-slate-800 p-4 rounded-md flex gap-3 flex-shrink-0 max-w-full"
                :to="'/tv/' + tv.id + '/season/' + season.season_number"
              >
                <div class="w-1/3">
                  <img
                    v-if="season.poster_path"
                    :src="'https://image.tmdb.org/t/p/w500/' + season.poster_path"
                    :alt="season.name"
                    class="rounded-md w-full"
                    loading="lazy"
                  />
                  <img
                    v-else
                    class="bg-slate-900 rounded-md"
                    src="@/assets/img/noPoster.png"
                    alt="No Poster"
                  />
                </div>
                <div class="w-2/3 min-w-0">
                  <h3 class="text-xl mb-2 font-bold">{{ season.name }}</h3>
                  <p class="text-sm mb-2 line-clamp-3">{{ season.overview }}</p>
                  <p class="text-sm">Episodes: {{ season.episode_count }}</p>
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
const { getTv, getTvCredits, backdropStyle } = useTmdb()

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
</script>

<style scoped>
.banner:before {
  content: '';
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
