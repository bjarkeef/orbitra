<template>
  <div :class="gridClasses">
    <HomePosterCard
      v-for="movie in movies"
      :key="movie.id"
      :item="movie"
      :media-type="movie.media_type || ''"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    movies: Array<Record<string, any>>
    loading?: boolean
  }>(),
  { loading: false },
)

const gridClasses = computed(() =>
  props.loading ? 'grid gap-4 sm:gap-6' : 'poster-grid',
)
</script>
