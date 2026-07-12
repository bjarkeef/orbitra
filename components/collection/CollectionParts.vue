<template>
  <div class="collection-parts" :class="variant === 'showcase' ? 'collection-parts--showcase' : ''">
    <!-- Compact progress (movie embed / default) -->
    <div
      v-if="variant !== 'showcase' && progress.total > 0"
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

    <!-- Showcase: vertical timeline -->
    <ol
      v-if="variant === 'showcase'"
      class="relative list-none p-0 m-0 space-y-0"
    >
      <li
        v-for="(part, index) in orderedParts"
        :key="part.id"
        class="relative flex gap-4 sm:gap-8 pb-10 last:pb-0"
        :class="highlightId === part.id ? 'opacity-100' : ''"
      >
        <!-- Timeline rail -->
        <div class="flex flex-col items-center shrink-0 w-10 sm:w-12">
          <div
            class="relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-sm font-black ring-2 shadow-lg"
            :class="ratingFor(part.id)
              ? 'bg-indigo-500 text-white ring-indigo-300/40 shadow-indigo-500/30'
              : 'bg-slate-800 text-slate-300 ring-slate-600/50'"
          >
            {{ part.watch_order }}
          </div>
          <div
            v-if="index < orderedParts.length - 1"
            class="w-px flex-1 min-h-[2rem] mt-2 bg-gradient-to-b from-slate-600 to-slate-800"
            aria-hidden="true"
          />
        </div>

        <!-- Card -->
        <article
          class="flex-1 min-w-0 group rounded-2xl overflow-hidden bg-slate-800/80 ring-1 ring-slate-700/80 hover:ring-indigo-400/40 transition-all shadow-xl shadow-black/20"
          :class="highlightId === part.id ? 'ring-2 ring-indigo-400/70' : ''"
        >
          <div class="flex flex-col sm:flex-row">
            <NuxtLink
              :to="'/m/' + part.id"
              class="relative sm:w-40 md:w-48 shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[14rem] block overflow-hidden bg-slate-900"
            >
              <NuxtImg
                v-if="posterSrc(part)"
                :src="posterSrc(part)"
                :alt="part.title || 'Movie'"
                width="500"
                height="750"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                format="webp"
                densities="1x 2x"
              />
              <NuxtImg
                v-else
                src="/img/noPoster.png"
                alt="No Poster"
                width="500"
                height="750"
                class="absolute inset-0 w-full h-full object-cover opacity-50"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent sm:hidden" />
            </NuxtLink>

            <div class="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Chapter {{ part.watch_order }}
                    <span v-if="yearOf(part)" class="text-slate-600"> · {{ yearOf(part) }}</span>
                  </p>
                  <NuxtLink
                    :to="'/m/' + part.id"
                    class="mt-1 block text-xl sm:text-2xl font-bold text-slate-50 hover:text-white transition-colors leading-snug"
                  >
                    {{ part.title || part.name || 'Untitled' }}
                  </NuxtLink>
                  <p class="text-sm text-slate-500 mt-1.5">
                    {{ formatDate(part.release_date) }}
                    <span v-if="part.vote_average != null" class="text-slate-600">
                      · ★ {{ Number(part.vote_average).toFixed(1) }} TMDB
                    </span>
                  </p>
                </div>

                <div
                  v-if="ratingFor(part.id)"
                  class="shrink-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 px-4 py-2 ring-1 ring-indigo-400/30 min-w-[4.5rem]"
                >
                  <span class="text-[10px] uppercase tracking-wider text-indigo-200/80">Yours</span>
                  <span class="text-2xl font-black text-indigo-100 leading-none">{{ ratingFor(part.id).score }}</span>
                  <span class="text-[10px] text-indigo-300/70">/ 10</span>
                </div>
                <div
                  v-else
                  class="shrink-0 rounded-xl bg-slate-900/60 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-700/50 self-start"
                >
                  Not rated
                </div>
              </div>

              <p
                v-if="part.overview"
                class="mt-3 text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1"
              >
                {{ part.overview }}
              </p>

              <div class="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-700/60">
                <NuxtLink
                  :to="'/m/' + part.id"
                  class="btn-secondary text-xs !py-1.5"
                >
                  Open title
                </NuxtLink>
                <label class="flex items-center gap-2 text-xs text-slate-400">
                  <span>Your rating</span>
                  <select
                    class="select-field text-xs py-1.5 min-w-[4rem]"
                    :value="scoreString(part.id)"
                    @change="onRate(part.id, $event)"
                  >
                    <option value="">—</option>
                    <option v-for="n in 10" :key="n" :value="String(n)">{{ n }}</option>
                  </select>
                </label>
                <span
                  v-if="justSavedId === part.id"
                  class="text-xs text-emerald-400/90"
                  role="status"
                >
                  Saved
                </span>
                <button
                  v-if="ratingFor(part.id)"
                  type="button"
                  class="text-xs text-slate-500 underline hover:text-slate-300"
                  @click="onClear(part.id)"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </article>
      </li>
    </ol>

    <!-- Default compact list (movie page embed) -->
    <ol v-else class="space-y-3 list-none p-0 m-0">
      <li
        v-for="part in orderedParts"
        :key="part.id"
        class="list-card !items-stretch"
        :class="highlightId === part.id ? 'ring-2 ring-indigo-400/60' : ''"
      >
        <NuxtLink
          :to="'/m/' + part.id"
          class="w-1/3 shrink-0 block max-w-[7rem]"
        >
          <NuxtImg
            v-if="posterSrc(part)"
            :src="posterSrc(part)"
            :alt="part.title || 'Movie'"
            width="185"
            height="278"
            class="rounded-md w-full bg-slate-900"
            loading="lazy"
            format="webp"
            densities="1x 2x"
          />
          <NuxtImg
            v-else
            src="/img/noPoster.png"
            alt="No Poster"
            width="185"
            height="278"
            class="bg-slate-900 rounded-md w-full"
            loading="lazy"
          />
        </NuxtLink>
        <div class="w-2/3 min-w-0 flex flex-col gap-2 flex-1">
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
              :value="scoreString(part.id)"
              @change="onRate(part.id, $event)"
            >
              <option value="">—</option>
              <option v-for="n in 10" :key="n" :value="String(n)">{{ n }}</option>
            </select>
            <span
              v-if="justSavedId === part.id"
              class="text-xs text-emerald-400/90"
              role="status"
            >
              Saved
            </span>
            <button
              v-if="ratingFor(part.id)"
              type="button"
              class="text-xs text-slate-500 underline hover:text-slate-300"
              @click="onClear(part.id)"
            >
              Clear
            </button>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
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
  /** `default` = compact list; `showcase` = timeline on collection page. */
  variant: {
    type: String,
    default: 'default',
  },
})

const { imageUrl, sortCollectionParts } = useTmdb()
const {
  ratings,
  getRating,
  getRatingScoreString,
  rateMovie,
  clearRating,
  progressForIds,
} = useMovieRatings()

const justSavedId = ref(null)
let savedTimer = null

const orderedParts = computed(() =>
  sortCollectionParts(props.collection?.parts || []),
)

// Depend on ratings map so progress / badges update when a score changes
const progress = computed(() => {
  void ratings.value
  return progressForIds(orderedParts.value.map(p => p.id))
})

function posterSrc(part) {
  return imageUrl(part?.poster_path, 'w500')
}

function yearOf(part) {
  const y = (part?.release_date || '').slice(0, 4)
  return /^\d{4}$/.test(y) ? y : ''
}

function formatDate(d) {
  if (!d) return 'Release date TBA'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  catch {
    return d
  }
}

function ratingFor(id) {
  void ratings.value
  return getRating(id)
}

function scoreString(id) {
  void ratings.value
  return getRatingScoreString(id)
}

function flashSaved(id) {
  justSavedId.value = id
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => {
    if (justSavedId.value === id) justSavedId.value = null
  }, 1600)
}

function onRate(id, ev) {
  const v = ev?.target?.value
  if (v === '' || v == null) {
    clearRating(id)
    return
  }
  if (rateMovie(id, Number(v))) flashSaved(id)
}

function onClear(id) {
  clearRating(id)
  justSavedId.value = null
}

onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer)
})
</script>
