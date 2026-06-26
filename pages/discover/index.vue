<template>
  <div class="page-shell">
    <div class="max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400/90">Browse</p>
      <h1 class="mt-1 text-3xl sm:text-4xl font-black text-slate-100">Discover</h1>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        Filter by where you can watch in
        <strong class="text-slate-300">{{ watchRegionLabel }}</strong>
        (change country in
        <NuxtLink to="/settings" class="text-indigo-300 underline hover:text-indigo-200">Settings</NuxtLink>).
        Pick a service to see what is on Netflix, Prime, and more — or browse buy/rent catalogues.
      </p>
    </div>

    <form
      class="mt-8 flex flex-col gap-5"
      @submit.prevent="applyFilters"
    >
      <div class="flex flex-wrap gap-4 items-end">
        <label class="block text-sm">
          <span class="text-slate-400">Media</span>
          <select v-model="media" class="input-field mt-1 w-full min-w-[8rem]">
            <option value="movie">Movies</option>
            <option value="tv">TV shows</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="text-slate-400">Availability</span>
          <select v-model="monetization" class="input-field mt-1 w-full min-w-[10rem]">
            <option value="flatrate">Streaming (subscription)</option>
            <option value="free">Free / ads</option>
            <option value="rent">Rent</option>
            <option value="buy">Buy</option>
            <option value="flatrate|free|ads|rent|buy">Any</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="text-slate-400">Sort</span>
          <select v-model="sortBy" class="input-field mt-1 w-full min-w-[10rem]">
            <option value="popularity.desc">Popularity</option>
            <option value="vote_average.desc">Rating</option>
            <option value="vote_count.desc">Vote count</option>
            <option value="primary_release_date.desc">Newest</option>
          </select>
        </label>

        <button type="submit" class="btn-primary">Apply</button>
        <button
          type="button"
          class="btn-secondary !bg-slate-800"
          @click="clearProvider"
        >
          Clear service
        </button>
      </div>

      <div>
        <p class="text-sm text-slate-400 mb-2">
          Service
          <span v-if="selectedProviderId" class="text-slate-300">
            — {{ selectedProviderName || 'selected' }}
          </span>
          <span v-else class="text-slate-500">— all in this availability mode</span>
        </p>
        <div v-if="providersPending" class="flex gap-2 overflow-x-auto py-1">
          <div
            v-for="n in 8"
            :key="n"
            class="shrink-0 w-14 h-14 rounded-lg bg-slate-800 animate-pulse"
          />
        </div>
        <div
          v-else-if="providerError"
          class="text-sm text-slate-500"
        >
          {{ providerError }}
        </div>
        <div
          v-else
          class="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1"
          role="listbox"
          aria-label="Watch providers"
        >
          <button
            v-for="p in providerList"
            :key="p.provider_id"
            type="button"
            role="option"
            :aria-selected="selectedProviderId === p.provider_id"
            class="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors"
            :class="providerChipClass(p)"
            @click="toggleProvider(p)"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              alt=""
              class="w-8 h-8 rounded-md object-cover shrink-0"
              loading="lazy"
            />
            <span class="text-xs font-medium max-w-[7rem] truncate">{{ p.provider_name }}</span>
          </button>
        </div>
      </div>
    </form>

    <div class="mt-8">
      <div v-if="resultsPending && !items.length">
        <SkeletonPosterGrid :count="12" />
      </div>
      <div v-else-if="resultsError" class="text-center text-slate-400 py-8">
        <p>{{ resultsError }}</p>
        <button type="button" class="btn-ghost mt-3" @click="refreshResults()">Retry</button>
      </div>
      <template v-else>
        <p class="text-sm text-slate-500 mb-4">
          <span v-if="totalResults != null">{{ totalResults.toLocaleString() }} titles</span>
          <span v-else>Results</span>
          in {{ watchRegionLabel }}
          <span v-if="selectedProviderName"> on {{ selectedProviderName }}</span>
        </p>
        <SearchMovieGrid v-if="items.length" :movies="gridItems" />
        <p v-else class="text-center text-slate-400 py-10">No titles match these filters.</p>
        <div v-if="items.length && page < totalPages" class="mt-6 flex justify-center">
          <button
            type="button"
            class="btn-load-more"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading…' : 'See more' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Discover — Orbitra' })

const {
  discoverMovies,
  discoverTv,
  getWatchProviderList,
  imageUrl,
} = useTmdb()
const { watchRegion, watchRegionLabel } = useWatchRegion()

const media = ref('movie')
const monetization = ref('flatrate')
const sortBy = ref('popularity.desc')
const selectedProviderId = ref(null)
const selectedProviderName = ref('')
const page = ref(1)
const loadingMore = ref(false)

const {
  data: providerData,
  pending: providersPending,
  error: providerErr,
} = useLazyAsyncData(
  () => `watch-providers-${media.value}-${watchRegion.value}`,
  async () => {
    const res = await getWatchProviderList(media.value, watchRegion.value)
    const list = (res.results || []).slice().sort((a, b) => {
      const pa = a.display_priority ?? 999
      const pb = b.display_priority ?? 999
      if (pa !== pb) return pa - pb
      return String(a.provider_name).localeCompare(String(b.provider_name))
    })
    return list
  },
  { watch: [media, watchRegion] },
)

const providerList = computed(() => providerData.value || [])
const providerError = computed(() => {
  const e = providerErr.value
  if (!e) return null
  return e.statusMessage || e.message || 'Could not load providers'
})

function providerChipClass(p) {
  return selectedProviderId.value === p.provider_id
    ? 'border-indigo-400 bg-indigo-500/20 text-slate-100'
    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
}

function buildDiscoverOpts(pageNum) {
  const opts = {
    page: pageNum,
    sort_by: sortBy.value,
    watch_region: watchRegion.value,
    with_watch_monetization_types: monetization.value,
  }
  // TMDB uses | as OR between provider ids
  if (selectedProviderId.value) {
    opts.with_watch_providers = String(selectedProviderId.value)
  }
  // TV discover uses first_air_date for "newest"
  if (media.value === 'tv' && sortBy.value === 'primary_release_date.desc') {
    opts.sort_by = 'first_air_date.desc'
  }
  return opts
}

const discoverKey = computed(
  () =>
    `discover-${media.value}-${watchRegion.value}-${monetization.value}-${selectedProviderId.value || 'all'}-${sortBy.value}`,
)

const {
  data: resultsData,
  pending: resultsPending,
  error: resultsErr,
  refresh: refreshResults,
} = useLazyAsyncData(
  () => discoverKey.value,
  async () => {
    page.value = 1
    const fn = media.value === 'tv' ? discoverTv : discoverMovies
    const res = await fn(buildDiscoverOpts(1))
    return {
      results: res.results || [],
      total_pages: res.total_pages || 1,
      total_results: res.total_results ?? null,
    }
  },
  { watch: [discoverKey] },
)

const items = computed(() => resultsData.value?.results || [])
const totalPages = computed(() => resultsData.value?.total_pages || 1)
const totalResults = computed(() => resultsData.value?.total_results)
const resultsError = computed(() => {
  const e = resultsErr.value
  if (!e) return null
  return e.statusMessage || e.message || 'Discover failed'
})

const gridItems = computed(() =>
  items.value.map((it) => ({
    ...it,
    media_type: media.value,
  })),
)

function logoSrc(path) {
  return imageUrl(path, 'w185')
}

function toggleProvider(p) {
  if (selectedProviderId.value === p.provider_id) {
    selectedProviderId.value = null
    selectedProviderName.value = ''
  } else {
    selectedProviderId.value = p.provider_id
    selectedProviderName.value = p.provider_name
  }
}

function clearProvider() {
  selectedProviderId.value = null
  selectedProviderName.value = ''
}

function applyFilters() {
  refreshResults()
}

watch(media, () => {
  // Provider ids differ between movie/tv catalogues — clear selection
  selectedProviderId.value = null
  selectedProviderName.value = ''
})

async function loadMore() {
  if (loadingMore.value || page.value >= totalPages.value) return
  loadingMore.value = true
  try {
    const next = page.value + 1
    const fn = media.value === 'tv' ? discoverTv : discoverMovies
    const res = await fn(buildDiscoverOpts(next))
    page.value = next
    if (resultsData.value) {
      resultsData.value = {
        ...resultsData.value,
        results: [...(resultsData.value.results || []), ...(res.results || [])],
      }
    }
  } catch {
    /* ignore */
  } finally {
    loadingMore.value = false
  }
}
</script>
