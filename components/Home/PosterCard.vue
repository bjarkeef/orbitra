<template>
  <NuxtLink
    :to="href"
    prefetch
    class="group block rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800/80 hover:ring-indigo-500/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-950/30 cursor-pointer"
  >
    <div class="relative aspect-[2/3] bg-slate-950 pointer-events-none">
      <img
        v-if="src"
        :src="src"
        :alt="label"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      <img
        v-else
        src="@/assets/img/noPoster.png"
        alt=""
        class="h-full w-full object-cover opacity-60"
        loading="lazy"
        draggable="false"
      />
      <div class="absolute inset-x-0 bottom-0 p-2.5 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <p class="text-xs font-semibold text-white line-clamp-2 leading-snug">{{ label }}</p>
        <p v-if="meta" class="text-[10px] text-slate-300 mt-0.5">{{ meta }}</p>
      </div>
      <span
        v-if="score"
        class="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-amber-200 backdrop-blur-sm"
      >
        ★ {{ score }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  item: { type: Object, required: true },
  mediaType: { type: String, default: '' },
})

const { imageUrl } = useTmdb()

const kind = computed(() => {
  const t = (props.mediaType || props.item?.media_type || '').toLowerCase()
  if (t === 'tv' || t === 'movie' || t === 'person') return t
  // Trending "all" mixes types; prefer explicit fields over guessing movie
  if (props.item?.media_type) return String(props.item.media_type).toLowerCase()
  if (props.item?.first_air_date && !props.item?.release_date) return 'tv'
  if (props.item?.name && !props.item?.title) return 'tv'
  return 'movie'
})

const href = computed(() => {
  const id = props.item?.id
  if (id == null) return '/'
  if (kind.value === 'tv') return `/tv/${id}`
  if (kind.value === 'person') return `/actor/${id}`
  return `/m/${id}`
})

const label = computed(() => {
  if (kind.value === 'movie') return props.item.title || props.item.original_title || 'Untitled'
  return props.item.name || props.item.title || 'Untitled'
})

const src = computed(() => {
  if (kind.value === 'person' && props.item.profile_path) return imageUrl(props.item.profile_path, 'w500')
  if (props.item.poster_path) return imageUrl(props.item.poster_path, 'w500')
  return ''
})

const score = computed(() => {
  const v = props.item?.vote_average
  if (v == null || Number.isNaN(Number(v))) return ''
  return Number(v).toFixed(1)
})

const meta = computed(() => {
  const d = props.item.release_date || props.item.first_air_date || ''
  return d.slice(0, 4)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
