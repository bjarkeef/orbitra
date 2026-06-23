<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <h2 class="text-4xl font-black mb-5 text-center w-full">See whats trending this week</h2>
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      <div v-for="n in 6" :key="n" class="bg-slate-700 h-48 rounded-md animate-pulse" />
    </div>
    <div v-else-if="error" class="text-center text-slate-400 py-8">
      <p>{{ error }}</p>
      <button type="button" class="mt-4 px-3 py-1.5 rounded-md bg-slate-900" @click="loadInitial">Retry</button>
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      <MMovie v-for="movie in movies" :key="movie.id + '-' + (movie.media_type || '')" :movie="movie" :mtype="movie.media_type" />
    </div>
    <button v-if="!error && !loading" type="button" class="p-2 rounded-md bg-slate-900 mt-6 mx-auto block" :disabled="loadingMore" @click="loadMore">
      {{ loadingMore ? 'Fetching more...' : 'Load more' }}
    </button>
  </div>
</template>
<script>
export default {
  data: () => ({ movies: [], loading: false, error: null, loadingMore: false, page: 1 }),
  async created() { await this.loadInitial() },
  methods: {
    async loadInitial() {
      const { getTrending } = useTmdb()
      this.loading = true; this.error = null; this.page = 1
      try { this.movies = (await getTrending('all', 'week', 1)).results || [] }
      catch (e) { this.error = e?.statusMessage || e?.message || 'Could not load trending.'; this.movies = [] }
      finally { this.loading = false }
    },
    async loadMore() {
      const { getTrending } = useTmdb()
      this.loadingMore = true
      try {
        const next = this.page + 1
        const res = await getTrending('all', 'week', next)
        this.page = next
        this.movies.push(...(res.results || []))
      } finally { this.loadingMore = false }
    },
  },
}
</script>
