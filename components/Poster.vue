<template>
  <div v-if="object" class="poster">
    <!-- Person profile -->
    <div v-if="mtype === 'person'">
      <img
        v-if="profileSrc"
        :src="profileSrc"
        :alt="label"
        class="rounded-lg w-full ring-1 ring-slate-700/50"
        loading="lazy"
      />
      <img
        v-else
        class="bg-slate-900 rounded-lg w-full ring-1 ring-slate-700/50"
        src="@/assets/img/noPoster.png"
        alt="No photo"
      />
    </div>

    <!-- TV / movie / collection poster -->
    <div v-else class="relative">
      <img
        v-if="posterSrc"
        :src="posterSrc"
        :alt="label"
        class="rounded-lg w-full ring-1 ring-slate-700/50"
        loading="lazy"
      />
      <img
        v-else
        class="bg-slate-900 rounded-lg w-full ring-1 ring-slate-700/50"
        src="@/assets/img/noPoster.png"
        alt="No poster"
      />

      <div
        v-if="mtype === 'movie' && trailerKey"
        class="absolute top-3 left-3 bg-slate-900/90 py-1 px-2 rounded-md text-sm text-slate-200 ring-1 ring-slate-600/60"
      >
        <a
          :href="'https://youtube.com/watch?v=' + trailerKey"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-white transition-colors"
        >Watch Trailer</a>
      </div>

      <div
        v-if="object.adult"
        class="absolute top-3 right-3 bg-slate-900/90 py-1 px-2 rounded-md text-sm ring-1 ring-slate-600/60"
      >
        <span class="text-lg leading-none text-amber-200">18+</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  object: { type: Object, default: null },
  mtype: { type: String, default: 'movie' },
})

const { imageUrl, getMovieVideos } = useTmdb()

const label = computed(() => {
  const o = props.object
  if (!o) return ''
  return o.title || o.name || 'Poster'
})

const profileSrc = computed(() => imageUrl(props.object?.profile_path, 'w500'))
const posterSrc = computed(() => imageUrl(props.object?.poster_path, 'w500'))

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
      videos.value = await getMovieVideos(id)
    } catch {
      videos.value = { results: [] }
    }
  },
  { immediate: true },
)
</script>
