<template>
  <div class="top100-page pb-16">
    <header class="relative overflow-hidden border-b border-slate-800/80">
      <div class="absolute inset-0 bg-gradient-to-b from-violet-950/35 via-slate-950 to-slate-900" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/12 via-transparent to-transparent" />

      <div class="relative page-shell !pb-10 !pt-10 sm:!pt-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
          Charts
        </p>
        <h1 class="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl">
          Top 100
        </h1>
        <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
          TMDB’s highest-rated titles, ordered by community score.
          Switch between movies and TV — open any poster for full details, collections, and where to watch.
        </p>

        <div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Chart type">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'movie'"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors ring-1"
            :class="tab === 'movie'
              ? 'bg-indigo-500 text-white ring-indigo-400/50 shadow-lg shadow-indigo-950/40'
              : 'bg-slate-900/60 text-slate-400 ring-slate-700/80 hover:text-slate-200'"
            @click="setTab('movie')"
          >
            Movies
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'tv'"
            class="rounded-full px-4 py-2 text-sm font-semibold transition-colors ring-1"
            :class="tab === 'tv'
              ? 'bg-indigo-500 text-white ring-indigo-400/50 shadow-lg shadow-indigo-950/40'
              : 'bg-slate-900/60 text-slate-400 ring-slate-700/80 hover:text-slate-200'"
            @click="setTab('tv')"
          >
            TV shows
          </button>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <span class="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
            Source: TMDB top rated
          </span>
          <span
            v-if="items.length"
            class="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10"
          >
            Showing {{ items.length }} of ~100
          </span>
        </div>
      </div>
    </header>

    <div class="page-shell !pt-8">
      <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-100">
            {{ tab === 'movie' ? 'Top rated movies' : 'Top rated TV' }}
          </h2>
          <p class="text-sm text-slate-500 mt-0.5">
            Ranked by TMDB vote average · load more to fill the top 100
          </p>
        </div>
      </div>

      <div v-if="pending && !items.length">
        <SkeletonPosterGrid :count="12" />
      </div>

      <div
        v-else-if="errorMsg"
        class="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center"
      >
        <p class="text-slate-300">{{ errorMsg }}</p>
        <button type="button" class="btn-primary mt-4 text-sm" @click="refresh()">
          Try again
        </button>
      </div>

      <template v-else-if="items.length">
        <div class="poster-grid">
          <div
            v-for="(item, index) in items"
            :key="tab + '-' + item.id"
            class="relative"
          >
            <span
              class="absolute z-10 -top-1.5 -left-1.5 flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg px-1.5 text-xs font-black shadow-lg ring-1"
              :class="rankClass(index)"
            >
              {{ index + 1 }}
            </span>
            <HomePosterCard
              :item="item"
              :media-type="tab"
            />
          </div>
        </div>

        <div
          v-if="items.length < 100 && page < totalPages"
          class="mt-10 flex flex-col items-center gap-3"
        >
          <button
            type="button"
            class="btn-primary"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading…' : 'Load more' }}
          </button>
          <p class="text-xs text-slate-500">
            {{ items.length }} loaded · aim for 100 on this list
          </p>
        </div>
        <p
          v-else-if="items.length >= 100"
          class="mt-10 text-center text-sm text-slate-500"
        >
          Top 100 loaded for {{ tab === 'movie' ? 'movies' : 'TV' }}.
        </p>
      </template>

      <div
        v-else
        class="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-6 py-12 text-center text-slate-400"
      >
        No titles returned.
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Top 100 — Orbitra' })

const { getTopRatedMovies, getTopRatedTv } = useTmdb()

const tab = ref('movie')
const items = ref([])
const page = ref(1)
const totalPages = ref(1)
const pending = ref(true)
const errorMsg = ref(null)
const loadingMore = ref(false)

async function fetchPage(media, pageNum) {
  const res =
    media === 'tv'
      ? await getTopRatedTv(pageNum)
      : await getTopRatedMovies(pageNum)
  return {
    results: res.results || [],
    total_pages: res.total_pages || 1,
  }
}

async function loadInitial() {
  pending.value = true
  errorMsg.value = null
  page.value = 1
  items.value = []
  try {
    const { results, total_pages } = await fetchPage(tab.value, 1)
    items.value = results
    totalPages.value = total_pages
  } catch (e) {
    errorMsg.value = e?.statusMessage || e?.message || 'Could not load chart'
    items.value = []
  } finally {
    pending.value = false
  }
}

function setTab(next) {
  if (tab.value === next) return
  tab.value = next
  loadInitial()
}

async function refresh() {
  await loadInitial()
}

async function loadMore() {
  if (loadingMore.value || items.value.length >= 100) return
  if (page.value >= totalPages.value) return
  loadingMore.value = true
  try {
    const next = page.value + 1
    const { results, total_pages } = await fetchPage(tab.value, next)
    page.value = next
    totalPages.value = total_pages
    const seen = new Set(items.value.map((i) => i.id))
    for (const row of results) {
      if (items.value.length >= 100) break
      if (seen.has(row.id)) continue
      seen.add(row.id)
      items.value.push(row)
    }
  } catch {
    /* ignore */
  } finally {
    loadingMore.value = false
  }
}

function rankClass(index) {
  if (index === 0) return 'bg-amber-400 text-amber-950 ring-amber-200/50'
  if (index === 1) return 'bg-slate-300 text-slate-900 ring-white/40'
  if (index === 2) return 'bg-amber-700/90 text-amber-50 ring-amber-500/40'
  return 'bg-slate-900/95 text-slate-200 ring-slate-600/60'
}

onMounted(() => loadInitial())
</script>
