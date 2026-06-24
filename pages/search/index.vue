<template>
  <div class="page-shell">
    <div class="flex justify-center flex-col items-center">
      <h2 class="text-3xl sm:text-4xl font-black text-center text-slate-100">
        Search movies, TV shows, actors and more..
      </h2>
      <input
        class="input-field mt-4 text-center w-full max-w-md min-w-control"
        type="text"
        v-model="query"
        placeholder="Search..."
      />
      <div class="flex items-center mt-3 gap-2">
        <input
          class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50"
          v-model="adult"
          name="adult"
          type="checkbox"
          id="adult"
        />
        <label class="text-sm text-slate-400" for="adult">Enable Adult (18+)</label>
      </div>
    </div>

    <div class="results mt-6">
      <div v-if="loading">
        <SkeletonPosterGrid :count="12" />
      </div>
      <div v-else-if="error" class="text-center text-slate-400 py-6">
        <p>{{ error }}</p>
      </div>
      <div v-else-if="movies && movies.length > 0">
        <SearchMovieGrid :movies="visibleMovies" />
        <button
          type="button"
          class="btn-load-more"
          @click="getMore"
        >
          {{ loadingMoreMovies ? 'Fetching more...' : 'See more results' }}
        </button>
      </div>
      <div v-else-if="searched && query && query.length > 2">
        <div class="flex justify-center">
          <p class="text-lg sm:text-xl text-slate-400">No results for: {{ query }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      movies: null,
      loading: false,
      error: null,
      searched: false,
      query: '',
      adult: false,
      currentMoviePage: 2,
      loadingMoreMovies: false,
      _debounceTimer: null,
    }
  },
  computed: {
    visibleMovies() {
      if (!this.movies) return []
      return this.currentMoviePage < 3 ? this.movies.slice(0, 18) : this.movies
    },
  },
  watch: {
    query() {
      this.scheduleSearch()
    },
    adult() {
      if (this.query && this.query.length > 2) this.scheduleSearch()
    },
  },
  beforeUnmount() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
  },
  // Nuxt 2 compat if needed
  beforeDestroy() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
  },
  methods: {
    scheduleSearch() {
      if (this._debounceTimer) clearTimeout(this._debounceTimer)
      const q = (this.query || '').trim()
      if (q.length <= 2) {
        this.movies = null
        this.searched = false
        this.error = null
        this.loading = false
        this.currentMoviePage = 2
        return
      }
      this._debounceTimer = setTimeout(() => this.search(), 300)
    },
    async search() {
      const { searchMulti } = useTmdb()
      const q = (this.query || '').trim()
      if (q.length <= 2) return

      this.loading = true
      this.error = null
      this.searched = true
      this.currentMoviePage = 2
      try {
        const results = await searchMulti(q, { include_adult: this.adult })
        const list = results.results || []
        this.movies = list.slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      } catch (e) {
        this.error = e?.statusMessage || e?.message || 'Search failed.'
        this.movies = []
      } finally {
        this.loading = false
      }
    },
    async getMore() {
      const { searchMulti } = useTmdb()
      const q = (this.query || '').trim()
      if (!q) return
      this.loadingMoreMovies = true
      try {
        const page = this.currentMoviePage
        const data = await searchMulti(q, {
          page,
          include_adult: this.adult,
        })
        this.currentMoviePage++
        this.movies.push(...(data.results || []))
      } catch (e) {
        /* ignore pagination errors */
      } finally {
        this.loadingMoreMovies = false
      }
    },
  },
}
</script>
