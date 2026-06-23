<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <div class="flex justify-center flex-col items-center">
      <h2 class="text-4xl font-black text-center">Search movies, TV shows, actors and more..</h2>
      <input v-model="query" class="bg-slate-900 mt-4 text-white p-2 rounded-lg text-center w-3/12 min-w-[12rem]" type="text" placeholder="Search..." />
      <div class="mt-2 flex items-center gap-2">
        <input id="adult" v-model="adult" type="checkbox" class="accent-indigo-500" />
        <label for="adult">Enable Adult (18+)</label>
      </div>
    </div>
    <div class="results mt-6">
      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <div v-for="n in 6" :key="n" class="bg-slate-700 h-48 rounded-md animate-pulse" />
      </div>
      <div v-else-if="error" class="text-center text-slate-400 py-6"><p>{{ error }}</p></div>
      <div v-else-if="movies && movies.length > 0">
        <SearchMovieGrid :movies="movies" />
        <button type="button" class="p-2 rounded-md bg-slate-900 mt-6 mx-auto block" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? 'Fetching more...' : 'See more results' }}
        </button>
      </div>
      <div v-else-if="searched && query.trim().length > 2" class="flex justify-center">
        <p class="text-xl">No results for: {{ query }}</p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data: () => ({ movies: null, loading: false, error: null, searched: false, query: '', adult: false, page: 1, loadingMore: false, _t: null }),
  watch: {
    query() { this.schedule() },
    adult() { if ((this.query || '').trim().length > 2) this.schedule() },
  },
  beforeUnmount() { if (this._t) clearTimeout(this._t) },
  methods: {
    schedule() {
      if (this._t) clearTimeout(this._t)
      const q = (this.query || '').trim()
      if (q.length <= 2) { this.movies = null; this.searched = false; this.error = null; this.loading = false; this.page = 1; return }
      this._t = setTimeout(() => this.search(), 300)
    },
    async search() {
      const { searchMulti } = useTmdb()
      const q = (this.query || '').trim()
      if (q.length <= 2) return
      this.loading = true; this.error = null; this.searched = true; this.page = 1
      try {
        const results = await searchMulti(q, { include_adult: this.adult, page: 1 })
        this.movies = (results.results || []).slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      } catch (e) { this.error = e?.statusMessage || e?.message || 'Search failed.'; this.movies = [] }
      finally { this.loading = false }
    },
    async loadMore() {
      const { searchMulti } = useTmdb()
      const q = (this.query || '').trim()
      if (!q) return
      this.loadingMore = true
      try {
        const next = this.page + 1
        const data = await searchMulti(q, { page: next, include_adult: this.adult })
        this.page = next
        this.movies.push(...(data.results || []))
      } finally { this.loadingMore = false }
    },
  },
}
</script>
