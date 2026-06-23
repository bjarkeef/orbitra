<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <h2 class="text-4xl font-black mb-4 text-center">Most popular movies</h2>
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      <div v-for="n in 6" :key="n" class="bg-slate-700 h-48 rounded-md animate-pulse" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      <MMovie v-for="movie in movies" :key="movie.id" :movie="movie" mtype="movie" />
    </div>
    <button type="button" class="p-2 rounded-md bg-slate-900 mt-6 mx-auto block" :disabled="loadingMore" @click="loadMore">
      {{ loadingMore ? 'Fetching more...' : 'Load more' }}
    </button>
  </div>
</template>
<script>
export default {
  data: () => ({ movies: [], loading: false, loadingMore: false, page: 1 }),
  async created() {
    const { discoverMovies } = useTmdb()
    this.loading = true
    try { this.movies = (await discoverMovies(1)).results || [] } finally { this.loading = false }
  },
  methods: {
    async loadMore() {
      const { discoverMovies } = useTmdb()
      this.loadingMore = true
      try {
        const next = this.page + 1
        const res = await discoverMovies(next)
        this.page = next
        this.movies.push(...(res.results || []))
      } finally { this.loadingMore = false }
    },
  },
}
</script>
