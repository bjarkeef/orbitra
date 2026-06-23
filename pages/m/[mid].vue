<template>
  <div>
    <div v-if="loading">
      <div class="bg-slate-700 shadow rounded-md p-4 h-96 w-full mx-auto animate-pulse" />
      <div class="details w-2/3 mx-auto p-6 mt-5 bg-slate-700 shadow rounded-lg h-96 animate-pulse" />
    </div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this movie</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>
    <div v-else-if="movie">
      <div class="movie pb-5">
        <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
        <div class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
          <div class="w-full gap-6 flex flex-wrap xl:block xl:w-1/3">
            <Poster class="w-1/3 xl:w-full basis-1/3" :object="movie" mtype="movie" :videos="videos" />
            <Information class="w-2/3 xl:w-full flex-1" mtype="movie" :object="movie" />
            <MCollection v-if="movie.belongs_to_collection" class="xl:w-full basis-full flex-1" :movie="movie" />
            <div v-if="providers?.results && Object.keys(providers.results).length" class="bg-slate-800 rounded-lg p-5 mt-0 xl:mt-6 hidden xl:block">
              <h3 class="mb-4 text-2xl font-bold">Providers</h3>
              <MProviders :providers="providers" />
            </div>
          </div>
          <div class="w-full xl:w-2/3 overflow-hidden">
            <MTitle :movie="movie" />
            <MCast :cast="cast" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getMovie, backdropStyle } = useTmdb()
const id = computed(() => String(route.params.mid || ''))

const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `movie-${id.value}`,
  async () => {
    const mid = id.value
    if (!/^\d+$/.test(mid)) throw createError({ statusCode: 400, statusMessage: 'Invalid movie id' })
    const movie = await getMovie(mid, { append_to_response: 'credits,watch/providers,videos' })
    return {
      movie,
      cast: movie.credits?.cast || [],
      providers: movie['watch/providers'] || null,
      videos: movie.videos || { results: [] },
      backdropImgPath: backdropStyle(movie.backdrop_path),
    }
  },
  { watch: [id] },
)

const movie = computed(() => data.value?.movie ?? null)
const cast = computed(() => data.value?.cast ?? [])
const providers = computed(() => data.value?.providers ?? null)
const videos = computed(() => data.value?.videos ?? { results: [] })
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
