<template>
  <div>
    <div v-if="loading"><div class="bg-slate-700 h-96 animate-pulse" /></div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this episode</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink :to="'/tv/' + tvId + '/season/' + seasonNum" class="underline text-indigo-400">Back to season</NuxtLink>
    </div>
    <div v-else-if="episode">
      <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
      <div class="details w-2/3 mx-auto p-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
        <NuxtLink class="bg-slate-700 text-sm rounded-md py-1 px-3 inline-block mb-4" :to="'/tv/' + tvId + '/season/' + seasonNum">Back to season</NuxtLink>
        <h1 class="text-4xl font-bold mb-2">{{ episode.name }}</h1>
        <p class="text-slate-400 text-sm mb-4">S{{ episode.season_number }}E{{ episode.episode_number }}</p>
        <p>{{ episode.overview }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getTvEpisode, backdropStyle } = useTmdb()
const tvId = computed(() => String(route.params.tvid || ''))
const seasonNum = computed(() => String(route.params.seasonnum || ''))
const episodeNum = computed(() => String(route.params.episodenum || ''))

const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `ep-${tvId.value}-${seasonNum.value}-${episodeNum.value}`,
  async () => {
    const episode = await getTvEpisode(tvId.value, seasonNum.value, episodeNum.value)
    return { episode, backdropImgPath: backdropStyle(episode?.still_path) }
  },
  { watch: [tvId, seasonNum, episodeNum] },
)

const episode = computed(() => data.value?.episode ?? null)
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
