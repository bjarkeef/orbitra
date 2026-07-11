<template>
  <section v-if="trailer" class="section-card">
    <div class="flex flex-wrap items-end justify-between gap-2 mb-4">
      <div>
        <h2 class="text-xl font-bold text-slate-100">{{ title }}</h2>
        <p v-if="trailer.name" class="text-xs text-slate-500 mt-0.5">
          {{ trailer.type }} · {{ trailer.name }}
        </p>
      </div>
      <a
        v-if="watchUrl"
        :href="watchUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
      >
        Watch on YouTube ↗
      </a>
    </div>
    <div class="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-slate-700/60 aspect-video">
      <iframe
        v-if="embedUrl"
        :src="embedUrl"
        class="absolute inset-0 w-full h-full border-0"
        title="Trailer"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TmdbVideos } from '~/composables/useTmdb'

const props = withDefaults(
  defineProps<{
    videos?: TmdbVideos | null
    title?: string
  }>(),
  {
    videos: null,
    title: 'Trailer',
  },
)

const { pickTrailer, youtubeEmbedUrl } = useTmdb()

const trailer = computed(() => pickTrailer(props.videos))
const embedUrl = computed(() =>
  trailer.value ? youtubeEmbedUrl(trailer.value.key) : '',
)
const watchUrl = computed(() =>
  trailer.value
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.value.key)}`
    : '',
)
</script>
