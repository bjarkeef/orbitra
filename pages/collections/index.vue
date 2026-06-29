<template>
  <div class="page-shell">
    <div class="max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400/90">Franchises</p>
      <h1 class="mt-1 text-3xl sm:text-4xl font-black text-slate-100">Collections</h1>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        TMDB groups movies into collections (trilogies, universes, series).
        Membership comes from each movie’s
        <code class="text-slate-300">belongs_to_collection</code>
        and the collection’s
        <code class="text-slate-300">parts</code>
        list. Rate films on a detail or collection page to track completeness.
      </p>
    </div>

    <form class="mt-8 flex flex-wrap gap-4 items-end" @submit.prevent="applyFilters">
      <label class="block text-sm">
        <span class="text-slate-400">Search name</span>
        <input v-model="q" type="search" class="input-field mt-1 w-full min-w-[12rem]" placeholder="e.g. Batman" />
      </label>
      <label class="block text-sm">
        <span class="text-slate-400">Genre (any part)</span>
        <select v-model="genre" class="input-field mt-1 w-full min-w-[10rem]">
          <option :value="null">Any genre</option>
          <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="text-slate-400">Completeness</span>
        <select v-model="completeness" class="input-field mt-1 w-full min-w-[10rem]">
          <option value="any">Any progress</option>
          <option value="started">Started (1+ rated)</option>
          <option value="partial">In progress (not finished)</option>
          <option value="complete">Complete (all rated)</option>
          <option value="untouched">Not started</option>
        </select>
      </label>
      <button type="submit" class="btn-primary">Apply</button>
    </form>

    <div class="mt-8">
      <div v-if="pending && !items.length">
        <SkeletonPosterGrid :count="8" />
      </div>
      <div v-else-if="errorMsg" class="text-center text-slate-400 py-8">
        <p>{{ errorMsg }}</p>
        <button type="button" class="btn-ghost mt-3" @click="refresh()">Retry</button>
      </div>
      <template v-else>
        <p class="text-sm text-slate-500 mb-4">
          {{ filteredItems.length }} collection{{ filteredItems.length === 1 ? '' : 's' }}
          <span v-if="catalogSize != null"> (catalog {{ catalogSize }})</span>
        </p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="c in filteredItems"
            :key="c.id"
            :to="'/collection/' + c.id"
            class="section-card hover:ring-1 hover:ring-indigo-500/40 transition-all flex flex-col gap-3"
          >
            <div class="flex gap-3">
              <img
                v-if="posterSrc(c)"
                :src="posterSrc(c)"
                :alt="c.name"
                class="w-16 h-24 object-cover rounded-md bg-slate-900 shrink-0"
                loading="lazy"
              />
              <div class="min-w-0">
                <h2 class="font-bold text-slate-100 line-clamp-2">{{ c.name }}</h2>
                <p class="text-xs text-slate-500 mt-1">
                  {{ c.part_count }} films
                  <span v-if="c.first_release_date">
                    · {{ yearOf(c.first_release_date) }}–{{ yearOf(c.last_release_date) || '?' }}
                  </span>
                </p>
                <p
                  v-if="progressLabel(c)"
                  class="text-xs mt-2 font-medium"
                  :class="progressClass(c)"
                >
                  {{ progressLabel(c) }}
                </p>
              </div>
            </div>
            <p v-if="c.overview" class="text-xs text-slate-500 line-clamp-2">{{ c.overview }}</p>
          </NuxtLink>
        </div>
        <p v-if="!filteredItems.length" class="text-center text-slate-400 py-10">
          No collections match these filters.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Collections — Orbitra' })

const { browseCollections, imageUrl } = useTmdb()
const { progressForIds } = useMovieRatings()

/** TMDB movie genre ids used for filter (static subset). */
const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

const q = ref('')
const genre = ref(null)
const completeness = ref('any')

const applied = ref({ q: '', genre: null })

const {
  data,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  'collections-browse',
  async () => {
    const res = await browseCollections({
      q: applied.value.q || undefined,
      genre: applied.value.genre,
    })
    return res
  },
)

const items = computed(() => data.value?.results || [])
const catalogSize = computed(() => data.value?.catalog_size)
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Failed to load collections'
})

const filteredItems = computed(() => {
  const mode = completeness.value
  if (mode === 'any') return items.value
  return items.value.filter((c) => {
    const { rated, total, complete } = progressForIds(c.part_ids || [])
    if (mode === 'untouched') return rated === 0
    if (mode === 'started') return rated >= 1
    if (mode === 'partial') return rated >= 1 && !complete
    if (mode === 'complete') return complete && total > 0
    return true
  })
})

function applyFilters() {
  applied.value = {
    q: (q.value || '').trim(),
    genre: genre.value,
  }
  refresh()
}

function posterSrc(c: { poster_path?: string | null }) {
  return imageUrl(c?.poster_path, 'w185')
}

function yearOf(d: string | null | undefined) {
  if (!d) return ''
  return String(d).slice(0, 4)
}

function progressLabel(c: { part_ids?: Array<string | number> }) {
  const { rated, total, complete } = progressForIds(c.part_ids || [])
  if (!total) return ''
  if (!rated) return ''
  if (complete) return `Complete — ${total}/${total} rated`
  return `You have seen ${rated} of ${total} in this series`
}

function progressClass(c: { part_ids?: Array<string | number> }) {
  const { rated, complete } = progressForIds(c.part_ids || [])
  if (complete) return 'text-emerald-300/90'
  if (rated > 0) return 'text-amber-200/90'
  return 'text-slate-500'
}
</script>
