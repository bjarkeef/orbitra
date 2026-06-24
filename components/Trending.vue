<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <h2 class="text-4xl font-black mb-5 text-center w-full">
      See whats trending this week
    </h2>
    <div v-if="loading">
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <div
          class="bg-slate-700 shadow rounded-md p-4 max-w-sm w-full mx-auto animate-pulse"
          v-for="num in 6"
          :key="num"></div>
      </div>
    </div>
    <div v-else-if="error" class="text-center text-slate-400 py-8">
      <p>{{ error }}</p>
      <button
        class="mt-4 px-3 py-1.5 rounded-md bg-slate-900"
        type="button"
        @click="loadInitial">
        Retry
      </button>
    </div>
    <div v-else>
      <div
        v-if="currentMoviePage < 3 && movies"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies.slice(0, 18)"
          :key="movie.id"
          :mtype="movie.media_type" />
      </div>
      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
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
      class="p-2 rounded-md text-center bg-slate-900 mt-6 mx-auto block"
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
