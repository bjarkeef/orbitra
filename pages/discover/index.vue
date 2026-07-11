<template>
  <div class="discover-page pb-16">
    <header class="relative border-b border-slate-800/80">
      <div class="absolute inset-0 bg-gradient-to-b from-cyan-950/30 via-slate-950 to-slate-900 pointer-events-none" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/14 via-transparent to-transparent pointer-events-none" />

      <div class="relative page-shell !pb-10 !pt-10 sm:!pt-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
          Browse
        </p>
        <h1 class="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl">
          Discover
        </h1>
        <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
          Browse the TMDB catalogue with optional region and streaming filters.
          Defaults to <strong class="text-slate-300 font-medium">everything</strong> — narrow down when you want.
        </p>
      </div>
    </header>

    <div class="page-shell !pt-8 space-y-8">
      <section class="section-card space-y-6 overflow-visible" aria-label="Discover filters">
        <!-- Region (on-page) -->
        <div class="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
          <label class="block text-sm flex-1 max-w-md">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Watch region</span>
            <select
              class="input-field mt-2 w-full"
              :value="watchRegion"
              @change="onRegionChange"
            >
              <option
                v-for="opt in regionOptions"
                :key="opt.code"
                :value="opt.code"
              >
                {{ opt.name }} ({{ opt.code }})
              </option>
            </select>
          </label>
          <p class="text-xs text-slate-500 sm:pb-3">
            Used for service logos and “where you can watch” filters. Saved like Settings.
          </p>
        </div>

        <!-- Media -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Media</p>
          <div class="flex flex-wrap gap-2" role="tablist" aria-label="Media type">
            <button
              v-for="opt in mediaOptions"
              :key="opt.id"
              type="button"
              role="tab"
              :aria-selected="media === opt.id"
              class="pill"
              :class="media === opt.id ? 'pill-active' : 'pill-idle'"
              @click="media = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Availability — default Any -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Availability</p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Monetization">
            <button
              v-for="opt in monetizationOptions"
              :key="opt.id"
              type="button"
              class="pill"
              :class="monetization === opt.id ? 'pill-active' : 'pill-idle'"
              @click="monetization = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Sort -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sort by</p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Sort">
            <button
              v-for="opt in sortOptions"
              :key="opt.id"
              type="button"
              class="pill"
              :class="sortBy === opt.id ? 'pill-active' : 'pill-idle'"
              @click="sortBy = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Genre (TMDB genre list for current media) -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Genre
              <span class="normal-case font-normal text-slate-500 tracking-normal ml-1">
                — {{ selectedGenreName || 'all' }}
              </span>
            </p>
            <button
              v-if="selectedGenreId"
              type="button"
              class="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
              @click="clearGenre"
            >
              Clear
            </button>
          </div>
          <div v-if="genresPending" class="flex flex-wrap gap-2">
            <div
              v-for="n in 8"
              :key="n"
              class="h-8 w-20 rounded-full bg-slate-800/80 animate-pulse"
            />
          </div>
          <p v-else-if="genreError" class="text-sm text-slate-500">
            {{ genreError }}
            <button type="button" class="btn-ghost ml-2" @click="refreshGenres()">Retry</button>
          </p>
          <div v-else class="flex flex-wrap gap-2" role="listbox" aria-label="Genres">
            <button
              type="button"
              role="option"
              :aria-selected="!selectedGenreId"
              class="pill"
              :class="!selectedGenreId ? 'pill-active' : 'pill-idle'"
              @click="clearGenre"
            >
              All genres
            </button>
            <button
              v-for="g in genreList"
              :key="g.id"
              type="button"
              role="option"
              :aria-selected="selectedGenreId === g.id"
              class="pill"
              :class="selectedGenreId === g.id ? 'pill-active' : 'pill-idle'"
              @click="toggleGenre(g)"
            >
              {{ g.name }}
            </button>
          </div>
        </div>

        <!-- Compact service logos (expand for full list) -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Service
              <span class="normal-case font-normal text-slate-500 tracking-normal ml-1">
                — {{ selectedProviderName || 'all' }}
              </span>
            </p>
            <div class="flex items-center gap-3">
              <button
                v-if="selectedProviderId"
                type="button"
                class="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                @click="clearProvider"
              >
                Clear
              </button>
              <button
                v-if="providerList.length > compactProviderLimit"
                type="button"
                class="text-xs font-semibold text-slate-400 hover:text-slate-200"
                @click="providersExpanded = !providersExpanded"
              >
                {{ providersExpanded ? 'Show less' : `Show all (${providerList.length})` }}
              </button>
            </div>
          </div>

          <div v-if="providersPending" class="flex flex-wrap gap-1.5">
            <div
              v-for="n in 10"
              :key="n"
              class="w-9 h-9 rounded-lg bg-slate-800/80 animate-pulse ring-1 ring-slate-700/40"
            />
          </div>
          <p v-else-if="providerError" class="text-sm text-slate-500">
            {{ providerError }}
            <button type="button" class="btn-ghost ml-2" @click="refreshProviders()">Retry</button>
          </p>
          <div
            v-else
            class="flex flex-wrap gap-1.5 content-start"
            :class="providersExpanded ? 'max-h-40 overflow-y-auto pr-1 scrollbar' : ''"
            role="listbox"
            aria-label="Watch providers"
          >
            <button
              type="button"
              role="option"
              :aria-selected="!selectedProviderId"
              title="All services"
              class="provider-logo-btn"
              :class="{ 'provider-logo-btn-active': !selectedProviderId }"
              @click="clearProvider"
            >
              <span class="text-[9px] font-bold text-slate-400 leading-none">ALL</span>
            </button>
            <button
              v-for="p in visibleProviders"
              :key="p.provider_id"
              type="button"
              role="option"
              :aria-selected="selectedProviderId === p.provider_id"
              class="provider-logo-btn"
              :class="{ 'provider-logo-btn-active': selectedProviderId === p.provider_id }"
              :title="p.provider_name"
              @click="toggleProvider(p)"
            >
              <img
                v-if="p.logo_path"
                :src="logoSrc(p.logo_path)"
                :alt="p.provider_name"
                class="w-full h-full object-cover rounded-[inherit]"
                loading="lazy"
              />
              <span
                v-else
                class="text-[9px] font-bold text-slate-500"
              >?</span>
            </button>
          </div>
        </div>
      </section>

      <section aria-live="polite">
        <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-100">
              {{ media === 'movie' ? 'Movies' : 'TV shows' }}
            </h2>
            <p class="text-sm text-slate-500 mt-0.5">
              <template v-if="totalResults != null">{{ totalResults.toLocaleString() }} titles</template>
              <template v-else>Results</template>
              · {{ watchRegionLabel }}
              · {{ monetizationLabel }}
              · {{ selectedGenreName || 'All genres' }}
              · {{ selectedProviderName || 'All services' }}
              · {{ sortLabel }}
            </p>
          </div>
          <button
            v-if="!resultsPending"
            type="button"
            class="text-xs font-semibold text-slate-400 hover:text-slate-200 ring-1 ring-slate-700 rounded-full px-3 py-1.5"
            @click="refreshResults()"
          >
            Refresh
          </button>
        </div>

        <div v-if="resultsPending && !items.length">
          <SkeletonPosterGrid :count="12" />
        </div>
        <div
          v-else-if="resultsError"
          class="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center"
        >
          <p class="text-slate-300">{{ resultsError }}</p>
          <button type="button" class="btn-primary mt-4 text-sm" @click="refreshResults()">
            Try again
          </button>
        </div>
        <template v-else-if="items.length">
          <div :class="resultsPending ? 'opacity-60 pointer-events-none' : ''">
            <SearchMovieGrid :movies="gridItems" />
          </div>
          <div v-if="page < totalPages" class="mt-8 flex justify-center">
            <button
              type="button"
              class="btn-primary min-w-[10rem]"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Loading…' : 'See more' }}
            </button>
          </div>
        </template>
        <div
          v-else
          class="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-6 py-14 text-center"
        >
          <p class="text-lg text-slate-300 font-medium">No titles match these filters</p>
          <p class="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Try <strong class="text-slate-400">All</strong> genres/services, <strong class="text-slate-400">Any</strong> availability, or another region.
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-3">
            <button
              v-if="selectedGenreId"
              type="button"
              class="btn-secondary !bg-slate-800"
              @click="clearGenre"
            >
              All genres
            </button>
            <button
              v-if="selectedProviderId"
              type="button"
              class="btn-secondary !bg-slate-800"
              @click="clearProvider"
            >
              All services
            </button>
            <button
              v-if="monetization !== ANY_MONETIZATION"
              type="button"
              class="btn-secondary !bg-slate-800"
              @click="monetization = ANY_MONETIZATION"
            >
              Any availability
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Discover — Orbitra' })
useSeoMeta({
  description: 'Discover movies and TV by region and streaming service on Orbitra.',
})

const ANY_MONETIZATION = 'flatrate|free|ads|rent|buy'

const {
  discoverMovies,
  discoverTv,
  getWatchProviderList,
  getGenreList,
  imageUrl,
} = useTmdb()

const {
  watchRegion,
  watchRegionLabel,
  setWatchRegion,
  regionOptions,
} = useWatchRegion()

const mediaOptions = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV shows' },
] as const

const monetizationOptions = [
  { id: ANY_MONETIZATION, label: 'Any' },
  { id: 'flatrate', label: 'Streaming' },
  { id: 'free', label: 'Free / ads' },
  { id: 'rent', label: 'Rent' },
  { id: 'buy', label: 'Buy' },
] as const

const sortOptions = [
  { id: 'popularity.desc', label: 'Popular' },
  { id: 'vote_average.desc', label: 'Top rated' },
  { id: 'vote_count.desc', label: 'Most votes' },
  { id: 'primary_release_date.desc', label: 'Newest' },
] as const

const media = ref<'movie' | 'tv'>('movie')
/** Default: all monetization types (no narrow stream-only gate). */
const monetization = ref(ANY_MONETIZATION)
const sortBy = ref('popularity.desc')
/** Default: all services (null). */
const selectedProviderId = ref<number | null>(null)
const selectedProviderName = ref('')
/** Default: all genres (null). */
const selectedGenreId = ref<number | null>(null)
const selectedGenreName = ref('')
const page = ref(1)
const loadingMore = ref(false)
/** Collapsed row: logos only; expand for the full catalogue. */
const providersExpanded = ref(false)
const compactProviderLimit = 14

const monetizationLabel = computed(
  () => monetizationOptions.find(o => o.id === monetization.value)?.label || 'Any',
)
const sortLabel = computed(
  () => sortOptions.find(o => o.id === sortBy.value)?.label || 'Sorted',
)

function onRegionChange(ev: Event) {
  const el = ev.target as HTMLSelectElement | null
  setWatchRegion(el?.value || 'US')
}

const {
  data: providerData,
  pending: providersPending,
  error: providerErr,
  refresh: refreshProviders,
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

const {
  data: genreData,
  pending: genresPending,
  error: genreErr,
  refresh: refreshGenres,
} = useLazyAsyncData(
  () => `genres-${media.value}`,
  async () => {
    const res = await getGenreList(media.value)
    return (res.genres || []).slice().sort((a, b) =>
      String(a.name).localeCompare(String(b.name)),
    )
  },
  { watch: [media] },
)

const genreList = computed(() => genreData.value || [])
const genreError = computed(() => {
  const e = genreErr.value
  if (!e) return null
  return e.statusMessage || e.message || 'Could not load genres'
})

const providerList = computed(() => providerData.value || [])
/** Keep selected service visible even when collapsed. */
const visibleProviders = computed(() => {
  const list = providerList.value
  if (providersExpanded.value || list.length <= compactProviderLimit) return list
  const head = list.slice(0, compactProviderLimit)
  const sel = selectedProviderId.value
  if (sel == null || head.some(p => p.provider_id === sel)) return head
  const selected = list.find(p => p.provider_id === sel)
  return selected ? [...head.slice(0, compactProviderLimit - 1), selected] : head
})
const providerError = computed(() => {
  const e = providerErr.value
  if (!e) return null
  return e.statusMessage || e.message || 'Could not load providers'
})

function buildDiscoverOpts(pageNum: number): Record<string, string | number> {
  const opts: Record<string, string | number> = {
    page: pageNum,
    sort_by: sortBy.value,
  }

  // Only constrain by region / providers when user picks a service or a specific availability
  const hasProvider = selectedProviderId.value != null
  const narrowMonetization = monetization.value !== ANY_MONETIZATION

  if (hasProvider || narrowMonetization) {
    opts.watch_region = watchRegion.value
  }
  if (narrowMonetization) {
    opts.with_watch_monetization_types = monetization.value
  }
  if (hasProvider) {
    opts.with_watch_providers = String(selectedProviderId.value)
    // Provider filter needs a region
    opts.watch_region = watchRegion.value
    if (!narrowMonetization) {
      opts.with_watch_monetization_types = ANY_MONETIZATION
    }
  }
  if (selectedGenreId.value != null) {
    opts.with_genres = String(selectedGenreId.value)
  }

  if (media.value === 'tv' && sortBy.value === 'primary_release_date.desc') {
    opts.sort_by = 'first_air_date.desc'
  }
  if (sortBy.value === 'vote_average.desc') {
    opts['vote_count.gte'] = 50
  }
  return opts
}

const discoverKey = computed(
  () =>
    `discover-${media.value}-${watchRegion.value}-${monetization.value}-${selectedProviderId.value || 'all'}-${selectedGenreId.value || 'all'}-${sortBy.value}`,
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
  items.value.map(it => ({
    ...it,
    media_type: media.value,
  })),
)

function logoSrc(path: string | null | undefined) {
  return imageUrl(path, 'w185')
}

function toggleProvider(p: { provider_id: number, provider_name?: string }) {
  if (selectedProviderId.value === p.provider_id) {
    clearProvider()
  }
  else {
    selectedProviderId.value = p.provider_id
    selectedProviderName.value = p.provider_name || ''
  }
}

function clearProvider() {
  selectedProviderId.value = null
  selectedProviderName.value = ''
}

function toggleGenre(g: { id: number, name?: string }) {
  if (selectedGenreId.value === g.id) {
    clearGenre()
  }
  else {
    selectedGenreId.value = g.id
    selectedGenreName.value = g.name || ''
  }
}

function clearGenre() {
  selectedGenreId.value = null
  selectedGenreName.value = ''
}

watch(media, () => {
  clearProvider()
  clearGenre()
  providersExpanded.value = false
})

watch(watchRegion, () => {
  providersExpanded.value = false
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
  }
  catch {
    /* ignore */
  }
  finally {
    loadingMore.value = false
  }
}
</script>

<style scoped>
.pill {
  @apply rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors ring-1;
}
.pill-active {
  @apply bg-indigo-500 text-white ring-indigo-400/50 shadow-md shadow-indigo-950/30;
}
.pill-idle {
  @apply bg-slate-900/70 text-slate-400 ring-slate-700/80 hover:text-slate-200 hover:ring-slate-600;
}

/* Compact logo-only chips — names live in title tooltips */
.provider-logo-btn {
  @apply w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0
    bg-slate-950 ring-1 ring-slate-700/70 overflow-hidden
    hover:ring-slate-500 transition-[box-shadow,ring-color];
}
.provider-logo-btn-active {
  @apply ring-2 ring-indigo-400/80 ring-offset-1 ring-offset-slate-800;
}
</style>
