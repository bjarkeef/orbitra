<template>
  <div class="tonight-page pb-16">
    <header class="relative border-b border-slate-800/80">
      <div class="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-slate-950 to-slate-900 pointer-events-none" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/16 via-transparent to-transparent pointer-events-none" />

      <div class="relative page-shell !pb-10 !pt-10 sm:!pt-14">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
          Mood · constraint
        </p>
        <h1 class="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl">
          Tonight
        </h1>
        <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
          Pick a mood and a time budget — we query TMDB discover with sensible defaults
          so you land on something watchable, not another endless filter panel.
        </p>
      </div>
    </header>

    <div class="page-shell !pt-8 space-y-8">
      <section class="section-card space-y-6" aria-label="Tonight filters">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Mood</p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2" role="listbox" aria-label="Mood presets">
            <button
              v-for="m in moods"
              :key="m.id"
              type="button"
              role="option"
              :aria-selected="moodId === m.id"
              class="text-left rounded-xl px-4 py-3 ring-1 transition-colors"
              :class="moodId === m.id
                ? 'bg-indigo-500/20 ring-indigo-400/50 text-white'
                : 'bg-slate-950/50 ring-slate-700/60 text-slate-300 hover:ring-slate-600'"
              @click="moodId = m.id"
            >
              <p class="text-sm font-bold">{{ m.label }}</p>
              <p class="text-xs text-slate-500 mt-0.5 leading-snug">{{ m.blurb }}</p>
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row flex-wrap gap-6">
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

          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Time budget
              <span class="normal-case font-normal tracking-normal text-slate-600 ml-1">
                (movies only)
              </span>
            </p>
            <div class="flex flex-wrap gap-2" role="group" aria-label="Runtime">
              <button
                v-for="opt in runtimeOptions"
                :key="opt.id"
                type="button"
                class="pill"
                :class="runtimeId === opt.id ? 'pill-active' : 'pill-idle'"
                :disabled="media === 'tv'"
                @click="runtimeId = opt.id"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="flex-1 min-w-[12rem] max-w-xs">
            <label class="block text-sm">
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
          </div>
        </div>

        <p class="text-xs text-slate-500">
          Active: <strong class="text-slate-300 font-medium">{{ activeMood.label }}</strong>
          · {{ media === 'movie' ? 'Movies' : 'TV' }}
          · {{ media === 'movie' ? runtimeLabel : 'any length' }}
          · {{ watchRegionLabel }}
          · vote floor {{ activeMood.voteFloor }}+
        </p>
      </section>

      <section aria-live="polite">
        <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-100">
              Picks for tonight
            </h2>
            <p class="text-sm text-slate-500 mt-0.5 max-w-xl">
              {{ activeMood.blurb }}
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
          <p class="text-lg text-slate-300 font-medium">Nothing matched this combo</p>
          <p class="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Try a looser time budget or another mood.
          </p>
        </div>
      </section>

      <p class="text-center text-xs text-slate-600">
        Want full control?
        <NuxtLink to="/discover" class="text-indigo-400 hover:text-indigo-300 font-semibold">
          Open Discover
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoverMediaOptions, TmdbMediaItem } from '~/composables/useTmdb'

useHead({ title: 'Tonight — Orbitra' })
useSeoMeta({
  description: 'Pick a mood and time budget — TMDB-backed picks for what to watch tonight on Orbitra.',
})

type MoodId
  = 'short'
    | 'comfort'
    | 'new'
    | 'feelgood'
    | 'mindbender'
    | 'crowd'

interface MoodPreset {
  id: MoodId
  label: string
  blurb: string
  genres?: string
  sort_by: string
  voteFloor: number
  voteCountGte: number
  yearsBack?: number
}

const moods: MoodPreset[] = [
  {
    id: 'short',
    label: 'Short night',
    blurb: 'Tight runtime — finish before midnight.',
    sort_by: 'popularity.desc',
    voteFloor: 6.5,
    voteCountGte: 200,
  },
  {
    id: 'comfort',
    label: 'Comfort rewatch',
    blurb: 'Well-loved titles with strong scores.',
    sort_by: 'vote_average.desc',
    voteFloor: 7.5,
    voteCountGte: 1500,
  },
  {
    id: 'new',
    label: 'Something new',
    blurb: 'Recent releases with early momentum.',
    sort_by: 'popularity.desc',
    voteFloor: 6,
    voteCountGte: 50,
    yearsBack: 2,
  },
  {
    id: 'feelgood',
    label: 'Feel-good',
    blurb: 'Comedy & family energy.',
    genres: '35|10751',
    sort_by: 'popularity.desc',
    voteFloor: 6.5,
    voteCountGte: 300,
  },
  {
    id: 'mindbender',
    label: 'Mind-bender',
    blurb: 'Thriller, sci-fi, and mystery.',
    genres: '53|878|9648',
    sort_by: 'vote_average.desc',
    voteFloor: 7,
    voteCountGte: 800,
  },
  {
    id: 'crowd',
    label: 'Crowd pleaser',
    blurb: 'Popular right now — easy group pick.',
    sort_by: 'popularity.desc',
    voteFloor: 6.8,
    voteCountGte: 500,
  },
]

const mediaOptions = [
  { id: 'movie' as const, label: 'Movies' },
  { id: 'tv' as const, label: 'TV shows' },
]

const runtimeOptions = [
  { id: 'any' as const, label: 'Any length', lte: null as number | null },
  { id: '90' as const, label: '≤ 90 min', lte: 90 },
  { id: '120' as const, label: '≤ 2 hrs', lte: 120 },
  { id: '150' as const, label: '≤ 2.5 hrs', lte: 150 },
]

const { watchRegion, watchRegionLabel, setWatchRegion, regionOptions } = useWatchRegion()
const { discoverMovies, discoverTv } = useTmdb()

const moodId = ref<MoodId>('short')
const media = ref<'movie' | 'tv'>('movie')
const runtimeId = ref<'any' | '90' | '120' | '150'>('90')
const page = ref(1)
const loadingMore = ref(false)

const activeMood = computed(
  () => moods.find(m => m.id === moodId.value) || moods[0]!,
)

const runtimeLabel = computed(
  () => runtimeOptions.find(r => r.id === runtimeId.value)?.label || 'Any length',
)

watch(moodId, (id) => {
  if (id === 'short' && media.value === 'movie' && runtimeId.value === 'any') {
    runtimeId.value = '90'
  }
})

watch(media, (m) => {
  if (m === 'tv') runtimeId.value = 'any'
})

function onRegionChange(ev: Event) {
  const el = ev.target as HTMLSelectElement | null
  setWatchRegion(el?.value || 'US')
}

function isoYearsAgo(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}

function buildOpts(pageNum: number): DiscoverMediaOptions {
  const mood = activeMood.value
  const opts: DiscoverMediaOptions = {
    'page': pageNum,
    'sort_by': mood.sort_by,
    'vote_average.gte': mood.voteFloor,
    'vote_count.gte': mood.voteCountGte,
  }
  if (mood.genres) opts.with_genres = mood.genres

  if (mood.yearsBack != null) {
    const gte = isoYearsAgo(mood.yearsBack)
    if (media.value === 'movie') opts['primary_release_date.gte'] = gte
    else opts['first_air_date.gte'] = gte
  }

  if (media.value === 'movie') {
    const rt = runtimeOptions.find(r => r.id === runtimeId.value)
    let lte = rt?.lte ?? null
    if (mood.id === 'short' && lte == null) lte = 100
    if (lte != null) opts['with_runtime.lte'] = lte
  }

  if (media.value === 'tv' && opts.sort_by === 'primary_release_date.desc') {
    opts.sort_by = 'first_air_date.desc'
  }

  return opts
}

const discoverKey = computed(
  () =>
    `tonight-${moodId.value}-${media.value}-${runtimeId.value}-${watchRegion.value}`,
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
    const res = await fn(buildOpts(1))
    return {
      results: res.results || [],
      total_pages: res.total_pages || 1,
    }
  },
  { watch: [discoverKey] },
)

const items = computed(() => resultsData.value?.results || [])
const totalPages = computed(() => resultsData.value?.total_pages || 1)
const resultsError = computed(() => {
  const e = resultsErr.value as { statusMessage?: string, message?: string } | null
  if (!e) return null
  return e.statusMessage || e.message || 'Tonight picks failed'
})

const gridItems = computed(() =>
  items.value.map((it: TmdbMediaItem) => ({
    ...it,
    media_type: media.value,
  })),
)

async function loadMore() {
  if (loadingMore.value || page.value >= totalPages.value) return
  loadingMore.value = true
  try {
    const next = page.value + 1
    const fn = media.value === 'tv' ? discoverTv : discoverMovies
    const res = await fn(buildOpts(next))
    const prev = resultsData.value
    resultsData.value = {
      results: [...(prev?.results || []), ...(res.results || [])],
      total_pages: res.total_pages || prev?.total_pages || 1,
    }
    page.value = next
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
.pill-idle:disabled {
  @apply opacity-40 cursor-not-allowed hover:text-slate-400 hover:ring-slate-700/80;
}
</style>
