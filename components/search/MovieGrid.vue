<template>
  <div class="poster-grid">
    <HomePosterCard
      v-for="movie in movies"
      :key="movie.id"
      :item="movie"
      :media-type="movie.media_type || ''"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  movies: Array<Record<string, unknown>>
}>()
</script>
