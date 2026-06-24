<template>
  <div v-if="object" class="poster">
    <!-- Person profile -->
    <div v-if="mtype === 'person'">
      <img
        v-if="object.profile_path"
        :src="imgBase + object.profile_path"
        :alt="label"
        class="rounded-md w-full"
        loading="lazy"
      />
      <img
        v-else
        class="bg-slate-900 rounded-md w-full"
        src="@/assets/img/noPoster.png"
        alt="No photo"
      />
    </div>

    <!-- TV / movie / collection poster -->
    <div v-else class="relative">
      <img
        v-if="object.poster_path"
        :src="imgBase + object.poster_path"
        :alt="label"
        class="rounded-md w-full"
        loading="lazy"
      />
      <img
        v-else
        class="bg-slate-900 rounded-md w-full"
        src="@/assets/img/noPoster.png"
        alt="No poster"
      />

      <div
        v-if="mtype === 'movie' && trailerKey"
        class="absolute top-3 left-3 bg-slate-700/90 py-1 px-2 rounded-md text-sm"
      >
        <a
          :href="'https://youtube.com/watch?v=' + trailerKey"
          target="_blank"
          rel="noopener noreferrer"
        >Watch Trailer</a>
      </div>

      <div
        v-if="object.adult"
        class="absolute top-3 right-3 bg-slate-700/90 py-1 px-2 rounded-md text-sm"
      >
        <span class="text-xl leading-none">18+</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  object: { type: Object, default: null },
  mtype: { type: String, default: 'movie' },
})

const imgBase = 'https://image.tmdb.org/t/p/w500/'

const label = computed(() => {
  const o = props.object
  if (!o) return ''
  return o.title || o.name || 'Poster'
})

const videos = ref(null)

const trailerKey = computed(() => {
  const results = videos.value?.results
  if (!Array.isArray(results) || !results.length) return null
  const yt = results.find((v) => v.site === 'YouTube' && v.key) || results[0]
  return yt?.key || null
})

watch(
  () => [props.mtype, props.object?.id],
  async ([type, id]) => {
    videos.value = null
    if (type !== 'movie' || !id) return
    try {
      const { getMovieVideos } = useTmdb()
      videos.value = await getMovieVideos(id)
    } catch {
      videos.value = { results: [] }
    }
  },
  { immediate: true },
)
</script>
