<template>
  <div :class="gridClasses">
    <MMovie
      v-for="movie in movies"
      :key="movie.id"
      :movie="movie"
      :mtype="movie.media_type"
      :loading="loading"
    />
  </div>
</template>

<script>
export default {
  props: {
    movies: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    gridClasses() {
      return this.loading ? 'grid gap-4 sm:gap-6' : 'poster-grid'
    },
  },
}
</script>
