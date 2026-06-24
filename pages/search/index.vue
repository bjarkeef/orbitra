<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <div class="flex justify-center flex-col items-center">
      <h2 class="text-4xl font-black text-center">
        Search movies, TV shows, actors and more..
      </h2>
      <input
        class="bg-slate-900 mt-4 text-white p-2 rounded-lg transition-all text-center w-3/12 min-w-[12rem]"
        type="text"
        v-model="query"
        placeholder="Search..."
      />
      <div class="d-flex mt-2 gap-2">
        <input
          class="bg-slate-900 mb-1 align-middle border-4 d-inline border-slate-900 checked:bg-blue-400 appearance-none text-white p-1 rounded-sm transition-all text-center"
          v-model="adult"
          name="adult"
          type="checkbox"
          id="adult"
        />
        <label class="d-inline-block" for="adult">Enable Adult (18+)</label>
      </div>
    </div>

    <div class="results mt-6">
      <div v-if="loading">
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
        >
          <div
            class="bg-slate-700 shadow rounded-md p-4 max-w-sm w-full mx-auto animate-pulse"
            v-for="num in 6"
            :key="num"
          ></div>
        </div>
      </div>
      <div v-else-if="error" class="text-center text-slate-400 py-6">
        <p>{{ error }}</p>
      </div>
      <div v-else-if="movies && movies.length > 0">
        <SearchMovieGrid :movies="visibleMovies" />
        <button
          class="p-2 rounded-md text-center bg-slate-900 mt-6 mx-auto block"
          @click="getMore"
        >
          {{ loadingMoreMovies ? 'Fetching more...' : 'See more results' }}
        </button>
      </div>
      <div v-else-if="searched && query && query.length > 2">
        <div class="flex justify-center">
          <p class="text-xl">No results for: {{ query }}</p>
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
