<template>
  <div class="page-shell">
    <h2 class="text-3xl sm:text-4xl font-black mb-5 text-center w-full text-slate-100">
      See whats trending this week
    </h2>
    <div v-if="loading">
      <SkeletonPosterGrid :count="6" />
    </div>
    <div v-else-if="error" class="text-center text-slate-400 py-8">
      <p>{{ error }}</p>
      <button
        class="mt-4 btn-secondary"
        type="button"
        @click="loadInitial">
        Retry
      </button>
    </div>
    <div v-else>
      <div
        v-if="currentMoviePage < 3 && movies"
        class="poster-grid">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies.slice(0, 18)"
          :key="movie.id"
          :mtype="movie.media_type" />
      </div>
      <div
        v-else
        class="poster-grid">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies"
          :key="movie.id"
          :mtype="movie.media_type" />
      </div>
    </div>
    <button
      v-if="!error"
      type="button"
      class="btn-load-more"
      @click="getMoreMovies(currentMoviePage)">
      {{ loadingMoreMovies ? 'Fetching more...' : 'Load more' }}
    </button>
  </div>
</template>
<script>
export default {
  data() {
    return {
      movies: null,
      loading: false,
      error: null,
      loadingMoreMovies: false,
      currentMoviePage: 2,
    }
  },
  async created() {
    await this.loadInitial()
  },
  methods: {
    async loadInitial() {
      const { getTrending } = useTmdb()
      this.loading = true
      this.error = null
      try {
        const movies = await getTrending('all', 'week', 1)
        this.movies = movies.results || []
      } catch (e) {
        this.error = e?.statusMessage || e?.message || 'Could not load trending.'
        this.movies = []
      } finally {
        this.loading = false
      }
    },
    async getMoreMovies(pageId) {
      const { getTrending } = useTmdb()
      this.loadingMoreMovies = true
      try {
        const movies = await getTrending('all', 'week', pageId)
        this.currentMoviePage++
        ;(movies.results || []).forEach((v) => {
          this.movies.push(v)
        })
      } catch (e) {
        /* keep existing list */
      } finally {
        this.loadingMoreMovies = false
      }
    },
  },
}
</script>
