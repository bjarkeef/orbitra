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
      <p class="mt-3 text-sm text-slate-500 text-center max-w-md">
        Adult results follow your
        <NuxtLink to="/settings" class="text-indigo-300 underline hover:text-indigo-200">Settings</NuxtLink>
        preference
        <span v-if="isAdultEnabled" class="text-rose-300">(18+ on)</span>
        <span v-else>(filtered out)</span>.
      </p>
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

<script setup>
const { isAdultEnabled } = useAdultContent()

const movies = ref(null)
const loading = ref(false)
const error = ref(null)
const searched = ref(false)
const query = ref('')
const currentMoviePage = ref(2)
const loadingMoreMovies = ref(false)
let _debounceTimer = null

const visibleMovies = computed(() => {
  if (!movies.value) return []
  return currentMoviePage.value < 3 ? movies.value.slice(0, 18) : movies.value
})

function scheduleSearch() {
  if (_debounceTimer) clearTimeout(_debounceTimer)
  const q = (query.value || '').trim()
  if (q.length <= 2) {
    movies.value = null
    searched.value = false
    error.value = null
    loading.value = false
    currentMoviePage.value = 2
    return
  }
  _debounceTimer = setTimeout(() => search(), 300)
}

watch(query, () => scheduleSearch())
watch(isAdultEnabled, () => {
  if (query.value && query.value.length > 2) scheduleSearch()
})

onBeforeUnmount(() => {
  if (_debounceTimer) clearTimeout(_debounceTimer)
})

async function search() {
  const { searchMulti } = useTmdb()
  const q = (query.value || '').trim()
  if (q.length <= 2) return

  loading.value = true
  error.value = null
  searched.value = true
  currentMoviePage.value = 2
  try {
    const results = await searchMulti(q)
    const list = results.results || []
    movies.value = list.slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
  } catch (e) {
    error.value = e?.statusMessage || e?.message || 'Search failed.'
    movies.value = []
  } finally {
    loading.value = false
  }
}

async function getMore() {
  const { searchMulti } = useTmdb()
  const q = (query.value || '').trim()
  if (!q) return
  loadingMoreMovies.value = true
  try {
    const page = currentMoviePage.value
    const data = await searchMulti(q, { page })
    currentMoviePage.value++
    movies.value.push(...(data.results || []))
  } catch (e) {
    /* ignore pagination errors */
  } finally {
    loadingMoreMovies.value = false
  }
}
</script>