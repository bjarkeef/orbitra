<template>
  <div class="page-shell">
    <h2 class="text-3xl sm:text-4xl w-full text-center font-black mb-2 text-slate-100">Most popular shows</h2>
    <p class="text-lg sm:text-xl w-full text-center font-medium mb-5 text-slate-400">See what shows are trending right now</p>
    <div v-if="loading">
      <SkeletonPosterGrid :count="12" />
    </div>
    <div v-else>
      <div
        v-if="correntShowPage < 3"
        class="poster-grid"
      >
        <MMovie
          :movie="movie"
          :mtype="mtype"
          :loading="loading"
          v-for="movie in movies.slice(0, 12)"
          :key="movie.id"
        />
      </div>
      <div v-else class="poster-grid">
        <MMovie
          :movie="movie"
          :mtype="mtype"
          :loading="loading"
          v-for="movie in movies"
          :key="movie.id"
        />
      </div>
    </div>
    <button
      type="button"
      class="btn-load-more"
      @click="getMoreShows(correntShowPage)"
    >
      {{ loadingMoreShows ? 'Fetching more shows...' : 'Load more' }}
    </button>
  </div>
</template>
<script>
export default {
  data() {
    return {
      movies: [],
      loading: false,
      loadingMoreShows: false,
      correntShowPage: 2,
      mtype: 'tv',
    }
  },
  async created() {
    const { discoverTv } = useTmdb()
    this.loading = true
    try {
      const movies = await discoverTv(1)
      this.movies = movies.results || []
    } catch {
      this.movies = []
    } finally {
      this.loading = false
    }
  },
  methods: {
    async getMoreShows(pageId) {
      const { discoverTv } = useTmdb()
      this.loadingMoreShows = true
      try {
        const movies = await discoverTv(pageId)
        this.correntShowPage++
        ;(movies.results || []).forEach((v) => this.movies.push(v))
      } finally {
        this.loadingMoreShows = false
      }
    },
  },
}
</script>