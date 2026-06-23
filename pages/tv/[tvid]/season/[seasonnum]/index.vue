<template>
  <div>
    <div v-if="loading"><div class="bg-slate-700 h-96 animate-pulse" /></div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this season</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink :to="'/tv/' + tvId" class="underline text-indigo-400">Back to show</NuxtLink>
    </div>
    <div v-else-if="season">
      <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
      <div class="details w-2/3 mx-auto p-6 flex gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
        <div class="w-1/3">
          <img v-if="season.poster_path" :src="img(season.poster_path)" :alt="season.name" class="rounded-md" loading="lazy" />
          <img v-else src="@/assets/img/noPoster.png" class="rounded-md bg-slate-900" alt="No Poster" />
        </div>
        <div class="w-2/3">
          <NuxtLink class="bg-slate-700 text-sm rounded-md py-1 px-3 inline-block" :to="'/tv/' + tvId">Go back to show</NuxtLink>
          <h1 class="mt-5 text-4xl font-bold mb-2">{{ tvname ? tvname + ' – ' + season.name : season.name }}</h1>
          <p class="mb-4">{{ season.overview }}</p>
          <div v-if="cast.length" class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
            <h3 class="mb-4 text-2xl font-bold">Cast</h3>
            <TvCast :cast="cast" />
          </div>
          <TvEpisodes v-if="season.episodes" :tv="tv" :season="season" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getTv, getTvSeason, tmdb, backdropStyle, imageUrl } = useTmdb()
const tvId = computed(() => String(route.params.tvid || ''))
const seasonNum = computed(() => String(route.params.seasonnum || ''))

const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `tv-${tvId.value}-season-${seasonNum.value}`,
  async () => {
    const [show, season] = await Promise.all([
      getTv(tvId.value).catch(() => null),
      getTvSeason(tvId.value, seasonNum.value),
    ])
    let cast = []
    try {
      const credits = await tmdb(`tv/${tvId.value}/season/${seasonNum.value}/credits`)
      cast = credits.cast || []
    } catch { cast = [] }
    return { tv: show, tvname: show?.name || null, season, cast, backdropImgPath: backdropStyle(show?.backdrop_path || season?.poster_path) }
  },
  { watch: [tvId, seasonNum] },
)

const tv = computed(() => data.value?.tv ?? null)
const tvname = computed(() => data.value?.tvname ?? null)
const season = computed(() => data.value?.season ?? null)
const cast = computed(() => data.value?.cast ?? [])
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
function img(path) { return imageUrl(path, 'w500') }
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
