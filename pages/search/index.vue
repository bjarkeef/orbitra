<template>
  <div class="search-page pb-16">
    <!-- Hero search band -->
    <header class="relative overflow-hidden border-b border-slate-800/80">
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-900" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent" />

      <div class="relative page-shell !pb-10 !pt-10 sm:!pt-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90 text-center sm:text-left">
          Search
        </p>
        <h1 class="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white text-center sm:text-left max-w-2xl">
          Find movies, shows &amp; people
        </h1>
        <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-xl text-center sm:text-left leading-relaxed">
          Multi-search across TMDB. Filter to what’s streaming in
          <NuxtLink to="/settings" class="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline">{{ watchRegionLabel }}</NuxtLink>,
          or browse
          <NuxtLink to="/discover" class="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline">Discover</NuxtLink>
          and
          <NuxtLink to="/collections" class="text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline">Collections</NuxtLink>.
        </p>

        <div class="mt-8 max-w-2xl mx-auto sm:mx-0">
          <label class="sr-only" for="orbitra-search-input">Search query</label>
          <div
            class="flex items-center gap-3 rounded-2xl bg-slate-900/90 ring-1 ring-slate-700/80 focus-within:ring-2 focus-within:ring-indigo-400/60 shadow-xl shadow-black/30 px-4 py-3 sm:px-5 sm:py-3.5 transition-shadow"
          >
            <span class="text-slate-500 shrink-0 text-lg" aria-hidden="true">⌕</span>
            <input
              id="orbitra-search-input"
              ref="inputEl"
              v-model="query"
              type="search"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              class="flex-1 min-w-0 bg-transparent text-base sm:text-lg text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="Try Inception, Breaking Bad, Nolan…"
            />
            <button
              v-if="query"
              type="button"
              class="text-xs font-semibold text-slate-400 hover:text-white shrink-0 px-2 py-1 rounded-md hover:bg-slate-800"
              @click="clearQuery"
            >
              Clear
            </button>
          </div>
          <p class="mt-2 text-xs text-slate-500">
            Type at least 3 characters · results update as you type
          </p>
        </div>

        <!-- Filters -->
        <div class="mt-6 flex flex-col sm:flex-row flex-wrap gap-4 sm:items-center">
          <div class="flex flex-wrap gap-2" role="group" aria-label="Result type">
            <button
              v-for="t in typeFilters"
              :key="t.id"
              type="button"
              class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ring-1"
              :class="mediaFilter === t.id
                ? 'bg-indigo-500 text-white ring-indigo-400/50'
                : 'bg-slate-900/60 text-slate-400 ring-slate-700/80 hover:text-slate-200 hover:ring-slate-600'"
              @click="mediaFilter = t.id"
            >
              {{ t.label }}
            </button>
          </div>

          <div class="hidden sm:block h-6 w-px bg-slate-700/80" aria-hidden="true" />

          <label class="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-300">
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
              <span class="text-slate-500 text-xs">({{ watchRegionLabel }})</span>
            </span>
          </label>

          <label class="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400">
            <input
              id="search-adult"
              v-model="adult"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50"
            />
            Include adult (18+)
          </label>
        </div>

        <p v-if="streamingOnly" class="mt-3 text-xs text-slate-500 max-w-xl">
          Only titles with a subscription stream in your country. People are hidden while this is on.
        </p>
      </div>
    </header>

    <div class="page-shell !pt-8">
      <!-- Idle / empty query -->
      <div
        v-if="!activeQuery"
        class="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-6 py-12 sm:py-16 text-center"
      >
        <p class="text-lg text-slate-300 font-medium">Start typing to search</p>
        <p class="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Or jump into curated browsing — same design language as the rest of Orbitra.
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <NuxtLink to="/discover" class="btn-primary text-sm">Discover by service</NuxtLink>
          <NuxtLink to="/collections" class="btn-secondary text-sm !bg-slate-800">Collections</NuxtLink>
          <NuxtLink to="/100" class="btn-secondary text-sm !bg-slate-800">Top 100</NuxtLink>
        </div>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-100">
              <template v-if="loading">Searching…</template>
              <template v-else-if="error">Something went wrong</template>
              <template v-else-if="filteredResults.length">
                {{ filteredResults.length }} result{{ filteredResults.length === 1 ? '' : 's' }}
              </template>
              <template v-else>No matches</template>
            </h2>
            <p class="text-sm text-slate-500 mt-0.5">
              for “{{ activeQuery }}”
              <span v-if="mediaFilter !== 'all'"> · {{ mediaFilterLabel }}</span>
              <span v-if="streamingOnly"> · streaming in {{ watchRegionLabel }}</span>
            </p>
          </div>
        </div>

        <div v-if="loading">
          <SkeletonPosterGrid :count="12" />
          <p v-if="streamingOnly" class="text-center text-xs text-slate-500 mt-4">
            Checking availability in {{ watchRegionLabel }}…
          </p>
        </div>

        <div
          v-else-if="error"
          class="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center"
        >
          <p class="text-slate-300">{{ error }}</p>
          <button type="button" class="btn-primary mt-4 text-sm" @click="search">
            Try again
          </button>
        </div>

        <template v-else-if="filteredResults.length">
          <div class="poster-grid">
            <HomePosterCard
              v-for="item in filteredResults"
              :key="(item.media_type || 'x') + '-' + item.id"
              :item="item"
            />
          </div>
          <div class="mt-10 flex justify-center">
            <button
              type="button"
              class="btn-primary"
              :disabled="loadingMore"
              @click="getMore"
            >
              {{ loadingMore ? 'Loading…' : 'Load more results' }}
            </button>
          </div>
        </template>

        <div
          v-else
          class="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-6 py-12 text-center"
        >
          <p class="text-lg text-slate-300">No results for “{{ activeQuery }}”</p>
          <p class="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            <template v-if="streamingOnly">
              Try turning off streaming only, or change country in Settings.
            </template>
            <template v-else-if="mediaFilter !== 'all'">
              Try “All types”, or a different spelling.
            </template>
            <template v-else>
              Check the spelling, or browse Discover instead.
            </template>
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Search — Orbitra' })

const { watchRegion, watchRegionLabel } = useWatchRegion()

const inputEl = ref(null)
const query = ref('')
const adult = ref(false)
const streamingOnly = ref(false)
const mediaFilter = ref('all')
const results = ref([])
const loading = ref(false)
const error = ref(null)
const searched = ref(false)
const nextPage = ref(2)
const loadingMore = ref(false)
let _debounceTimer = null

const typeFilters = [
  { id: 'all', label: 'All types' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'person', label: 'People' },
]

const activeQuery = computed(() => (query.value || '').trim())

const mediaFilterLabel = computed(() =>
  typeFilters.find((t) => t.id === mediaFilter.value)?.label || '',
)

const filteredResults = computed(() => {
  const list = results.value || []
  if (mediaFilter.value === 'all') return list
  return list.filter((item) => {
    const t = (item.media_type || '').toLowerCase()
    if (mediaFilter.value === 'movie') return t === 'movie' || (!t && item.title)
    if (mediaFilter.value === 'tv') return t === 'tv' || (!t && item.name && !item.title)
    if (mediaFilter.value === 'person') return t === 'person'
    return true
  })
})

function clearQuery() {
  query.value = ''
  results.value = []
  searched.value = false
  error.value = null
  nextTick(() => inputEl.value?.focus?.())
}

function scheduleSearch() {
  if (_debounceTimer) clearTimeout(_debounceTimer)
  const q = activeQuery.value
  if (q.length <= 2) {
    results.value = []
    searched.value = false
    error.value = null
    loading.value = false
    nextPage.value = 2
    return
  }
  _debounceTimer = setTimeout(() => search(), 300)
}

watch(query, () => scheduleSearch())
watch(adult, () => {
  if (activeQuery.value.length > 2) scheduleSearch()
})
watch(streamingOnly, () => {
  if (activeQuery.value.length > 2) scheduleSearch()
})
watch(watchRegion, () => {
  if (streamingOnly.value && activeQuery.value.length > 2) scheduleSearch()
})

onMounted(() => {
  inputEl.value?.focus?.()
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
  const q = activeQuery.value
  if (q.length <= 2) return

  loading.value = true
  error.value = null
  searched.value = true
  nextPage.value = 2
  try {
    const res = await searchMulti(q, { include_adult: adult.value })
    let list = res.results || []
    list = list.slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    list = await applyStreamingFilter(list)
    results.value = list
  } catch (e) {
    error.value = e?.statusMessage || e?.message || 'Search failed.'
    results.value = []
  } finally {
    loading.value = false
  }
}

async function getMore() {
  const { searchMulti } = useTmdb()
  const q = activeQuery.value
  if (!q) return
  loadingMore.value = true
  try {
    const page = nextPage.value
    const data = await searchMulti(q, {
      page,
      include_adult: adult.value,
    })
    nextPage.value++
    let extra = data.results || []
    extra = await applyStreamingFilter(extra)
    results.value = [...results.value, ...extra]
  } catch {
    /* ignore pagination errors */
  } finally {
    loadingMore.value = false
  }
}
</script>
