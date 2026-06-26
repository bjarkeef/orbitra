<template>
  <div class="xl:mt-6">
    <!-- Single compact card: identity + progress + poster strip + CTA -->
    <div
      class="rounded-xl overflow-hidden ring-1 ring-slate-700/60 bg-slate-800/90 shadow-lg shadow-black/20"
    >
      <NuxtLink
        :to="collectionPath"
        class="relative block px-4 py-3.5 bg-cover bg-center"
        :style="backdropImgPath"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/70" />
        <div class="relative z-10 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/90">
              Collection
            </p>
            <h2 class="mt-0.5 text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
              {{ movie.belongs_to_collection.name }}
            </h2>
            <p
              v-if="progressLine"
              class="mt-1.5 text-xs leading-snug"
              :class="progressTone"
            >
              {{ progressLine }}
            </p>
          </div>
          <span
            v-if="progress.total"
            class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ring-1"
            :class="progress.complete
              ? 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30'
              : progress.rated
                ? 'bg-amber-500/15 text-amber-100 ring-amber-400/25'
                : 'bg-white/10 text-slate-300 ring-white/10'"
          >
            {{ progress.rated }}/{{ progress.total }}
          </span>
        </div>
        <div
          v-if="progress.total"
          class="relative z-10 mt-3 h-1 rounded-full bg-slate-800/80 overflow-hidden"
        >
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all"
            :style="{ width: Math.max(progress.percent, progress.rated ? 6 : 0) + '%' }"
          />
        </div>
      </NuxtLink>

      <!-- Mini posters only — no ratings / long copy in the sidebar -->
      <div v-if="collectionPending" class="px-3 py-3 flex gap-2">
        <div
          v-for="n in 4"
          :key="n"
          class="shrink-0 w-11 aspect-[2/3] rounded-md bg-slate-700/50 animate-pulse"
        />
      </div>
      <div
        v-else-if="orderedParts.length"
        class="px-3 py-3 flex gap-2 overflow-x-auto scrollbar"
        role="list"
        aria-label="Films in this collection"
      >
        <NuxtLink
          v-for="part in orderedParts"
          :key="part.id"
          :to="'/m/' + part.id"
          role="listitem"
          class="group relative shrink-0 w-11 sm:w-12"
          :title="partTitle(part)"
        >
          <div
            class="rounded-md overflow-hidden aspect-[2/3] bg-slate-900 ring-1 transition-all"
            :class="isCurrent(part)
              ? 'ring-2 ring-indigo-400 shadow-md shadow-indigo-500/20'
              : 'ring-slate-700/80 group-hover:ring-slate-500'"
          >
            <img
              v-if="posterSrc(part)"
              :src="posterSrc(part)"
              :alt="partTitle(part)"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <img
              v-else
              src="@/assets/img/noPoster.png"
              alt=""
              class="w-full h-full object-cover opacity-50"
            />
          </div>
          <span
            class="absolute -top-1 -left-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none"
            :class="isCurrent(part)
              ? 'bg-indigo-500 text-white'
              : hasRated(part.id)
                ? 'bg-indigo-500/80 text-white'
                : 'bg-slate-700 text-slate-300'"
          >
            {{ part.watch_order }}
          </span>
          <span
            v-if="hasRated(part.id)"
            class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-800"
            title="Rated"
          />
        </NuxtLink>
      </div>

      <div class="px-3 pb-3 pt-0">
        <NuxtLink
          :to="collectionPath"
          class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900/80 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-slate-700/80 hover:bg-slate-900 hover:text-white transition-colors"
        >
          Full watch order
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
})

const { getCollection, backdropStyle, imageUrl, sortCollectionParts } = useTmdb()
const { ratings, progressForIds, hasRated: hasRatedFn } = useMovieRatings()

const backdropImgPath = computed(() =>
  backdropStyle(props.movie?.belongs_to_collection?.backdrop_path),
)

const collectionId = computed(() => props.movie?.belongs_to_collection?.id)

const collectionPath = computed(
  () => '/collection/' + props.movie?.belongs_to_collection?.id,
)

const {
  data: collection,
  pending: collectionPending,
} = useLazyAsyncData(
  () => `movie-collection-embed-${collectionId.value}`,
  async () => {
    if (!collectionId.value) return null
    return getCollection(collectionId.value)
  },
  { watch: [collectionId] },
)

const orderedParts = computed(() =>
  sortCollectionParts(collection.value?.parts || []),
)

const progress = computed(() => {
  void ratings.value
  return progressForIds(orderedParts.value.map((p) => p.id))
})

const progressLine = computed(() => {
  const { rated, total, complete } = progress.value
  if (!total) return ''
  if (!rated) return `${total} films · rate on collection page`
  if (complete) return 'You finished this series'
  return `You have seen ${rated} of ${total}`
})

const progressTone = computed(() => {
  if (progress.value.complete) return 'text-emerald-300/90'
  if (progress.value.rated) return 'text-amber-200/90'
  return 'text-slate-400'
})

function posterSrc(part) {
  return imageUrl(part?.poster_path, 'w185')
}

function partTitle(part) {
  return part?.title || part?.name || 'Film'
}

function isCurrent(part) {
  return Number(part?.id) === Number(props.movie?.id)
}

function hasRated(id) {
  void ratings.value
  return hasRatedFn(id)
}
</script>
