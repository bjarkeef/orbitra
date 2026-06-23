<template>
  <div>
    <div v-if="loading">
      <div class="bg-slate-700 shadow rounded-md p-4 h-96 w-full mx-auto animate-pulse" />
    </div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this show</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>
    <div v-else-if="tv">
      <div class="tv pb-5">
        <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
        <div class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
          <div class="w-full gap-6 flex xl:block xl:w-1/3">
            <Poster class="w-1/3 xl:w-full" :object="tv" mtype="tv" />
            <Information class="w-2/3 xl:w-full" :object="tv" mtype="tv" />
          </div>
          <div class="w-full xl:w-2/3 overflow-hidden">
            <div class="bg-slate-800 w-full rounded-lg p-5">
              <h1 class="text-4xl font-bold mb-2">{{ tv.name }}</h1>
              <h4 v-if="tv.tagline" class="text-xl italic mb-4">{{ tv.tagline }}</h4>
              <hr class="border-slate-900 border-opacity-50 mb-4" />
              <p>{{ tv.overview }}</p>
            </div>
            <div v-if="cast.length" class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
              <h3 class="mb-4 text-2xl font-bold">Cast</h3>
              <TvCast :cast="cast" />
            </div>
            <div v-if="crew.length" class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
              <h3 class="mb-4 text-2xl font-bold">Crew</h3>
              <TvCast :cast="crew" />
            </div>
            <div v-if="tv.seasons" class="seasons mt-3">
              <h3 class="text-2xl mb-2 font-bold">Seasons</h3>
              <div class="gap-3 grid grid-cols-2">
                <NuxtLink v-for="season in tv.seasons" :key="season.id" class="bg-slate-800 p-4 rounded-md flex gap-3" :to="'/tv/' + tv.id + '/season/' + season.season_number">
                  <div class="w-1/3">
                    <img v-if="season.poster_path" :src="img(season.poster_path)" :alt="season.name" class="rounded-md w-full" loading="lazy" />
                    <img v-else class="bg-slate-900 rounded-md" src="@/assets/img/noPoster.png" alt="No Poster" />
                  </div>
                  <div class="w-2/3">
                    <h3 class="text-xl mb-2 font-bold">{{ season.name }}</h3>
                    <p class="text-sm">Episodes: {{ season.episode_count }}</p>
                  </div>
                </NuxtLink>
              </div>
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
const id = computed(() => String(route.params.tvid || ''))

const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `tv-${id.value}`,
  async () => {
    const tid = id.value
    if (!/^\d+$/.test(tid)) throw createError({ statusCode: 400, statusMessage: 'Invalid TV id' })
    const [tv, credits] = await Promise.all([getTv(tid), getTvCredits(tid).catch(() => ({ cast: [], crew: [] }))])
    return { tv, cast: credits.cast || [], crew: credits.crew || [], backdropImgPath: backdropStyle(tv.backdrop_path) }
  },
  { watch: [id], lazy: import.meta.client },
)

const tv = computed(() => data.value?.tv ?? null)
const cast = computed(() => data.value?.cast ?? [])
const crew = computed(() => data.value?.crew ?? [])
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
function img(path) { return imageUrl(path, 'w500') }
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
