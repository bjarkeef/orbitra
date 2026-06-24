<template>
  <div>
    <SkeletonDetailPage v-if="pending && !movie" />

    <div v-else-if="errorMsg && !movie" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this movie</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="underline text-indigo-400 mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>

    <div v-else-if="movie" class="movie pb-5">
      <div
        class="banner bg-cover bg-no-repeat bg-center relative h-56 sm:h-72 md:h-96"
        :style="backdropImgPath"
      />
      <div
        class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg"
      >
        <div class="w-full gap-6 flex flex-wrap xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full basis-1/3" :object="movie" mtype="movie" />
          <Information class="w-2/3 xl:w-full flex-1" mtype="movie" :object="movie" />
          <MCollection
            v-if="movie.belongs_to_collection"
            class="xl:w-full basis-full flex-1"
            :movie="movie"
          />
          <div
            v-if="providers?.results && Object.keys(providers.results).length"
            class="bg-slate-800 rounded-lg p-5 mt-0 xl:mt-6 hidden xl:block"
          >
            <h3 class="mb-4 text-2xl font-bold">Providers</h3>
            <MProviders :providers="providers" />
          </div>
          <div
            v-else-if="extrasPending"
            class="hidden xl:block mt-6 h-24 rounded-lg bg-slate-800/80 animate-pulse"
          />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden">
          <MTitle :movie="movie" />
          <div v-if="extrasPending && !cast.length" class="mt-6">
            <div class="h-6 w-24 rounded bg-slate-700/70 animate-pulse mb-4" />
            <div class="flex gap-3 overflow-hidden">
              <div v-for="n in 6" :key="n" class="shrink-0 w-20 aspect-[2/3] rounded-md bg-slate-700/60 animate-pulse" />
            </div>
          </div>
          <MCast v-else :cast="cast" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getMovie, getMovieCredits, getMovieProviders, backdropStyle } = useTmdb()

const id = computed(() => String(route.params.mid))

const {
  data: movie,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `movie-${id.value}`,
  () => getMovie(id.value),
  { watch: [id] },
)

const {
  data: extras,
  pending: extrasPending,
} = useLazyAsyncData(
  () => `movie-extras-${id.value}`,
  async () => {
    const mid = id.value
    const [credits, providers] = await Promise.all([
      getMovieCredits(mid).catch(() => ({ cast: [] })),
      getMovieProviders(mid).catch(() => null),
    ])
    return {
      cast: credits?.cast || [],
      providers,
    }
  },
  { watch: [id] },
)

const cast = computed(() => extras.value?.cast || [])
const providers = computed(() => extras.value?.providers || null)
const backdropImgPath = computed(() => backdropStyle(movie.value?.backdrop_path))
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
