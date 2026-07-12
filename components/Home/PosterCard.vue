<template>
  <NuxtLink
    :to="href"
    prefetch
    class="group block rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800/80 hover:ring-indigo-500/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-950/30 cursor-pointer"
  >
    <div class="relative aspect-poster bg-slate-950 pointer-events-none">
      <NuxtImg
        v-if="src"
        :src="src"
        :alt="label"
        width="500"
        height="750"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-103"
        loading="lazy"
        format="webp"
        densities="1x 2x"
      />
      <NuxtImg
        v-else
        src="/img/noPoster.png"
        alt=""
        width="500"
        height="750"
        class="h-full w-full object-cover opacity-60 bg-slate-900"
        loading="lazy"
        draggable="false"
      />
      <div class="absolute inset-x-0 bottom-0 p-2.5 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <p class="text-xs font-semibold text-white line-clamp-2 leading-snug">{{ label }}</p>
        <p v-if="meta" class="text-2xs text-slate-300 mt-0.5">{{ meta }}</p>
      </div>
      <UIRatingBadge
        v-if="kind !== 'person'"
        class="absolute top-2 right-2 z-[1]"
        :vote-average="item?.vote_average"
        :vote-count="item?.vote_count"
      />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps({
  item: { type: Object, required: true },
  mediaType: { type: String, default: '' },
})

const { imageUrl } = useTmdb()

const kind = computed(() => {
  const t = (props.mediaType || props.item?.media_type || '').toLowerCase()
  if (t === 'tv' || t === 'movie' || t === 'person') return t
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
  if (kind.value === 'person') {
    return imageUrl(props.item?.profile_path, 'w500') || imageUrl(props.item?.poster_path, 'w500')
  }
  return imageUrl(props.item?.poster_path, 'w500') || imageUrl(props.item?.profile_path, 'w500')
})

const meta = computed(() => {
  const d = props.item.release_date || props.item.first_air_date || ''
  const year = d.slice(0, 4)
  // On hover overlay: year only — score lives on the badge (avoids duplicate ★)
  return year || ''
})
</script>
