<template>
  <div class="poster-grid">
    <HomePosterCard
      v-for="movie in movies"
      :key="String(movie.id)"
      :item="movie"
      :media-type="String(movie.media_type || '')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  movies: Array<Record<string, unknown> & { id?: string | number, media_type?: string }>
}>()
</script>
