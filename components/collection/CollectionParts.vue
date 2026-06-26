<template>
  <div class="collection-parts">
    <div
      v-if="progress.total > 0"
      class="mb-4 rounded-lg border border-slate-700/80 bg-slate-900/50 px-4 py-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-slate-200 font-semibold">
          Your progress:
          <span class="text-indigo-300">{{ progress.rated }}</span>
          of
          <span class="text-slate-100">{{ progress.total }}</span>
          rated
        </p>
        <p
          v-if="progress.rated > 0 && !progress.complete"
          class="text-xs text-amber-200/90"
        >
          You have seen {{ progress.rated }} of {{ progress.total }} in this series
        </p>
        <p v-else-if="progress.complete" class="text-xs text-emerald-300/90">
          Collection complete — you rated every part
        </p>
      </div>
      <div class="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          class="h-full rounded-full bg-indigo-500 transition-all"
          :style="{ width: progress.percent + '%' }"
        />
      </div>
    </div>

    <ol class="space-y-3 list-none p-0 m-0">
      <li
        v-for="part in orderedParts"
        :key="part.id"
        class="list-card !items-stretch"
        :class="highlightId === part.id ? 'ring-2 ring-indigo-400/60' : ''"
      >
        <NuxtLink
          :to="'/m/' + part.id"
          class="w-1/3 shrink-0 block"
        >
          <img
            v-if="posterSrc(part)"
            :src="posterSrc(part)"
            :alt="part.title || 'Movie'"
            class="rounded-md w-full bg-slate-900"
            loading="lazy"
          />
          <img
            v-else
            class="bg-slate-900 rounded-md w-full"
            src="@/assets/img/noPoster.png"
            alt="No Poster"
          />
        </NuxtLink>
        <div class="w-2/3 min-w-0 flex flex-col gap-2">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Watch order #{{ part.watch_order }}
              </p>
              <NuxtLink
                :to="'/m/' + part.id"
                class="text-lg sm:text-xl font-bold text-slate-100 hover:text-white"
              >
                {{ part.title || part.name || 'Untitled' }}
              </NuxtLink>
              <p class="text-sm text-slate-500 mt-0.5">
                {{ formatDate(part.release_date) }}
                <span v-if="part.vote_average != null" class="text-slate-600">
                  · TMDB {{ Number(part.vote_average).toFixed(1) }}
                </span>
              </p>
            </div>
            <div
              v-if="ratingFor(part.id)"
              class="shrink-0 rounded-md bg-indigo-500/20 px-2 py-1 text-sm font-semibold text-indigo-200"
              :title="'Your rating'"
            >
              Your rating: {{ ratingFor(part.id).score }}/10
            </div>
            <div
              v-else
              class="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-500"
            >
              Not rated
            </div>
          </div>
          <p v-if="part.overview" class="text-sm text-slate-400 line-clamp-2">
            {{ part.overview }}
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-auto pt-1">
            <label class="text-xs text-slate-500">Rate</label>
            <select
              class="select-field text-xs py-1"
              :value="ratingFor(part.id)?.score ?? ''"
              @change="onRate(part.id, $event)"
            >
              <option value="">—</option>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            <button
              v-if="ratingFor(part.id)"
              type="button"
              class="text-xs text-slate-500 underline hover:text-slate-300"
              @click="clearRating(part.id)"
            >
              Clear
            </button>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup>
const props = defineProps({
  /** Full TMDB collection payload (with parts). */
  collection: {
    type: Object,
    required: true,
  },
  /** Current movie id to highlight (detail page embed). */
  highlightId: {
    type: [Number, String],
    default: null,
  },
})

const { imageUrl, sortCollectionParts } = useTmdb()
const { getRating, rateMovie, clearRating, progressForIds } = useMovieRatings()

const orderedParts = computed(() =>
  sortCollectionParts(props.collection?.parts || []),
)

const progress = computed(() =>
  progressForIds(orderedParts.value.map((p) => p.id)),
)

function posterSrc(part) {
  return imageUrl(part?.poster_path, 'w500')
}

function formatDate(d) {
  if (!d) return 'Release date TBA'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

function ratingFor(id) {
  return getRating(id)
}

function onRate(id, ev) {
  const v = ev?.target?.value
  if (v === '' || v == null) {
    clearRating(id)
    return
  }
  rateMovie(id, Number(v))
}
</script>
