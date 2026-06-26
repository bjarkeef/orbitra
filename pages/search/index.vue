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
      <div class="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400">
          <input
            class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50"
            v-model="adult"
            name="adult"
            type="checkbox"
            id="adult"
          />
          Enable Adult (18+)
        </label>
        <label class="flex items-center gap-3 cursor-pointer select-none text-sm text-slate-300">
          <button
            type="button"
            role="switch"
            :aria-checked="streamingOnly"
            class="relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            :class="streamingOnly ? 'bg-indigo-500' : 'bg-slate-600'"
            @click="streamingOnly = !streamingOnly"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition"
              :class="streamingOnly ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
          <span>
            Streaming only
            <span class="text-slate-500">({{ watchRegionLabel }})</span>
          </span>
        </label>
      </div>
      <p v-if="streamingOnly" class="mt-2 text-xs text-slate-500 text-center max-w-md">
        Only titles with a subscription stream in your country (set in
        <NuxtLink to="/settings" class="text-indigo-300 underline">Settings</NuxtLink>).
        People are excluded from results.
      </p>
    </div>

    <div class="results mt-6">
      <div v-if="loading">
        <SkeletonPosterGrid :count="12" />
        <p v-if="streamingOnly" class="text-center text-xs text-slate-500 mt-3">
          Checking availability in {{ watchRegionLabel }}…
        </p>
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
          <p class="text-lg sm:text-xl text-slate-400">
            No results for: {{ query }}
            <span v-if="streamingOnly" class="block text-sm mt-2 text-slate-500">
              Try turning off streaming only, or change country in Settings.
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { watchRegion, watchRegionLabel } = useWatchRegion()

const movies = ref(null)
const loading = ref(false)
const error = ref(null)
const searched = ref(false)
const query = ref('')
const adult = ref(false)
const streamingOnly = ref(false)
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
watch(adult, () => {
  if (query.value && query.value.length > 2) scheduleSearch()
})
watch(streamingOnly, () => {
  if (query.value && query.value.length > 2) scheduleSearch()
})
watch(watchRegion, () => {
  if (streamingOnly.value && query.value && query.value.length > 2) scheduleSearch()
})

onBeforeUnmount(() => {
  if (_debounceTimer) clearTimeout(_debounceTimer)
})

async function applyStreamingFilter(list) {
  if (!streamingOnly.value) return list
  const { filterStreamingOnly } = useTmdb()
  return filterStreamingOnly(list, watchRegion.value)
}

async function search() {
  const { searchMulti } = useTmdb()
  const q = (query.value || '').trim()
  if (q.length <= 2) return

  loading.value = true
  error.value = null
  searched.value = true
  currentMoviePage.value = 2
  try {
    const results = await searchMulti(q, { include_adult: adult.value })
    let list = results.results || []
    list = list.slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    list = await applyStreamingFilter(list)
    movies.value = list
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
    const data = await searchMulti(q, {
      page,
      include_adult: adult.value,
    })
    currentMoviePage.value++
    let extra = data.results || []
    extra = await applyStreamingFilter(extra)
    movies.value.push(...extra)
  } catch (e) {
    /* ignore pagination errors */
  } finally {
    loadingMoreMovies.value = false
  }
}
</script>
