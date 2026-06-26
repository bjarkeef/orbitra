<template>
  <div class="page-shell">
    <div class="max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-widest text-rose-400/90">18+ explore</p>
      <h1 class="mt-1 text-3xl sm:text-4xl font-black text-slate-100">
        Adult catalogue
      </h1>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        Separate from the main home rails — filter by media type, minimum rating, genre
        combinations that matter for adult titles, and sort by popularity or release date.
        Only available when adult content is enabled in
        <NuxtLink to="/settings" class="text-indigo-300 underline hover:text-indigo-200">Settings</NuxtLink>.
      </p>
    </div>

    <div
      v-if="!isAdultEnabled"
      class="mt-10 rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-center"
    >
      <p class="text-slate-300">Adult explore is off.</p>
      <button type="button" class="btn-primary mt-4" @click="enableAndStay">
        Enable adult content
      </button>
    </div>

    <template v-else>
      <form
        class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
        @submit.prevent="applyFilters"
      >
        <label class="block text-sm">
          <span class="text-slate-400">Media</span>
          <select v-model="media" class="input-field mt-1 w-full">
            <option value="movie">Movies</option>
            <option value="tv">TV</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="text-slate-400">Sort</span>
          <select v-model="sortBy" class="input-field mt-1 w-full">
            <option value="popularity.desc">Popularity</option>
            <option value="primary_release_date.desc">Release date (movies)</option>
            <option value="first_air_date.desc">First air date (TV)</option>
            <option value="vote_average.desc">Rating</option>
            <option value="vote_count.desc">Vote count</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="text-slate-400">Min rating (0–10)</span>
          <input
            v-model.number="minRating"
            type="number"
            min="0"
            max="10"
            step="0.5"
            class="input-field mt-1 w-full"
          />
        </label>

        <label class="block text-sm">
          <span class="text-slate-400">Genre focus</span>
          <select v-model="genrePreset" class="input-field mt-1 w-full">
            <option value="">Any</option>
            <option value="drama">Drama-leaning</option>
            <option value="thriller">Thriller / crime</option>
            <option value="romance">Romance</option>
            <option value="comedy">Comedy</option>
            <option value="doc">Documentary</option>
          </select>
        </label>

        <div class="sm:col-span-2 lg:col-span-4">
          <button type="submit" class="btn-primary">Apply filters</button>
        </div>
      </form>

      <div class="mt-8">
        <div v-if="pending" class="py-4">
          <SkeletonPosterGrid :count="12" />
        </div>
        <div v-else-if="err" class="text-center text-slate-400 py-8">
          <p>{{ err }}</p>
          <button type="button" class="btn-ghost mt-2" @click="refresh()">Retry</button>
        </div>
        <div v-else-if="items.length" class="poster-grid">
          <HomePosterCard
            v-for="item in items"
            :key="item.id + '-' + (item.media_type || media)"
            :item="item"
            :media-type="media"
          />
        </div>
        <p v-else class="text-center text-slate-500 py-10">
          No titles matched these filters. Try lowering the minimum rating.
        </p>

        <div v-if="items.length" class="flex justify-center gap-3 mt-8">
          <button
            type="button"
            class="btn-secondary"
            :disabled="page <= 1 || pending"
            @click="page--; refresh()"
          >
            Previous
          </button>
          <span class="self-center text-sm text-slate-500">Page {{ page }}</span>
          <button
            type="button"
            class="btn-secondary"
            :disabled="pending || page >= (totalPages || 1)"
            @click="page++; refresh()"
          >
            Next
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
useHead({ title: 'Adult explore — Orbitra' })

const { isAdultEnabled, enableAdultContent } = useAdultContent()
const { discoverAdultMedia } = useTmdb()

const media = ref('movie')
const sortBy = ref('popularity.desc')
const minRating = ref(0)
const genrePreset = ref('')
const page = ref(1)

/** TMDB genre ids useful for adult-adjacent browsing (not exclusive). */
const GENRE_PRESETS = {
  drama: { movie: '18', tv: '18' },
  thriller: { movie: '53,80', tv: '80,9648' },
  romance: { movie: '10749', tv: '10749' },
  comedy: { movie: '35', tv: '35' },
  doc: { movie: '99', tv: '99' },
}

const queryKey = computed(() =>
  [
    'adult-explore',
    media.value,
    sortBy.value,
    minRating.value,
    genrePreset.value,
    page.value,
    isAdultEnabled.value ? '1' : '0',
  ].join('|'),
)

const { data, pending, error, refresh } = useLazyAsyncData(
  () => queryKey.value,
  async () => {
    if (!isAdultEnabled.value) {
      return { results: [], total_pages: 0 }
    }
    let sort = sortBy.value
    // TMDB rejects wrong date sort field per media type
    if (media.value === 'movie' && sort === 'first_air_date.desc') {
      sort = 'primary_release_date.desc'
    }
    if (media.value === 'tv' && sort === 'primary_release_date.desc') {
      sort = 'first_air_date.desc'
    }
    const preset = GENRE_PRESETS[genrePreset.value]
    const with_genres = preset ? preset[media.value] : undefined
    const res = await discoverAdultMedia(media.value, {
      page: page.value,
      sort_by: sort,
      'vote_average.gte': minRating.value > 0 ? minRating.value : undefined,
      'vote_count.gte': 20,
      with_genres,
    })
    return {
      results: res?.results || [],
      total_pages: res?.total_pages || 0,
    }
  },
  { watch: [queryKey] },
)

const items = computed(() => data.value?.results || [])
const totalPages = computed(() => data.value?.total_pages || 0)
const err = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Failed to load'
})

function applyFilters() {
  page.value = 1
  refresh()
}

function enableAndStay() {
  enableAdultContent()
}

// Guard: if user lands here without preference, offer enable (no auto-gate on passive visit)
watch(isAdultEnabled, (on) => {
  if (on) refresh()
})
</script>