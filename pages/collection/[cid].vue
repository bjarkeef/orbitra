<template>
  <div>
    <SkeletonDetailPage v-if="pending && !collection" />

    <div v-else-if="errorMsg && !collection" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this collection</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <NuxtLink to="/collections" class="btn-ghost mr-4">Browse collections</NuxtLink>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="collection" class="collection-page pb-16">
      <!-- Cinematic hero -->
      <header class="relative w-full overflow-hidden min-h-[22rem] sm:min-h-[28rem] md:min-h-[32rem]">
        <div
          class="absolute inset-0 bg-cover bg-center scale-105"
          :style="backdropImgPath"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/30" />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/50 to-transparent" />
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

        <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pb-16 flex flex-col sm:flex-row gap-8 sm:gap-10 items-end min-h-[22rem] sm:min-h-[28rem] md:min-h-[32rem]">
          <div class="shrink-0 w-36 sm:w-44 md:w-52 -mb-4 sm:mb-0 self-center sm:self-end">
            <div class="rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 aspect-[2/3] bg-slate-900">
              <NuxtImg
                v-if="posterUrl"
                :src="posterUrl"
                :alt="collection.name"
                width="500"
                height="750"
                class="w-full h-full object-cover"
                loading="eager"
                format="webp"
                densities="1x 2x"
              />
              <NuxtImg
                v-else
                src="/img/noPoster.png"
                alt=""
                width="500"
                height="750"
                class="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>

          <div class="flex-1 min-w-0 pb-2 text-center sm:text-left">
            <NuxtLink
              to="/collections"
              class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300/90 hover:text-indigo-200 transition-colors mb-3"
            >
              <span aria-hidden="true">←</span> Collections
            </NuxtLink>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400/80 mb-2">
              Franchise collection
            </p>
            <h1 class="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05] drop-shadow-lg">
              {{ collection.name }}
            </h1>
            <p
              v-if="collection.overview"
              class="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl line-clamp-4 mx-auto sm:mx-0"
            >
              {{ collection.overview }}
            </p>

            <div class="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
              <span class="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-sm text-slate-100 ring-1 ring-white/10">
                {{ orderedParts.length }} film{{ orderedParts.length === 1 ? '' : 's' }}
              </span>
              <span
                v-if="yearSpan"
                class="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-sm text-slate-100 ring-1 ring-white/10"
              >
                {{ yearSpan }}
              </span>
              <span
                class="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm ring-1"
                :class="progress.complete
                  ? 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30'
                  : progress.rated > 0
                    ? 'bg-amber-500/15 text-amber-100 ring-amber-400/25'
                    : 'bg-white/10 text-slate-300 ring-white/10'"
              >
                <template v-if="progress.complete">Complete · {{ progress.rated }}/{{ progress.total }}</template>
                <template v-else-if="progress.rated > 0">{{ progress.rated }} of {{ progress.total }} rated</template>
                <template v-else>Not started</template>
              </span>
            </div>

            <!-- Hero progress -->
            <div
              v-if="progress.total > 0"
              class="mt-6 max-w-md mx-auto sm:mx-0"
            >
              <div class="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Your journey</span>
                <span>{{ progress.percent }}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-slate-800/80 overflow-hidden ring-1 ring-white/5">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-500 shadow-lg shadow-indigo-500/30"
                  :style="{ width: Math.max(progress.percent, progress.rated ? 4 : 0) + '%' }"
                />
              </div>
              <p
                v-if="progress.rated > 0 && !progress.complete"
                class="mt-2 text-sm text-amber-200/90"
              >
                You have seen {{ progress.rated }} of {{ progress.total }} in this series
              </p>
              <p
                v-else-if="progress.complete"
                class="mt-2 text-sm text-emerald-300/90"
              >
                You rated every title in this collection
              </p>
            </div>
          </div>
        </div>
      </header>

      <!-- Timeline / parts -->
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-2 relative z-10">
        <div class="flex flex-wrap items-end justify-between gap-3 mb-6 pt-4">
          <div>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Watch order
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              Sorted by release date · rate each film as you go
            </p>
          </div>
        </div>

        <CollectionParts
          :collection="collection"
          variant="showcase"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getCollection, backdropStyle, imageUrl, sortCollectionParts } = useTmdb()
const { progressForIds } = useMovieRatings()

const id = computed(() => String(route.params.cid))

const {
  data: collection,
  pending,
  error,
} = useLazyAsyncData(
  () => `collection-${id.value}`,
  () => getCollection(id.value),
  { watch: [id] },
)

const orderedParts = computed(() =>
  sortCollectionParts(collection.value?.parts || []),
)

const progress = computed(() =>
  progressForIds(orderedParts.value.map(p => p.id)),
)

const posterUrl = computed(() =>
  imageUrl(collection.value?.poster_path, 'w500'),
)

const backdropImgPath = computed(() =>
  backdropStyle(collection.value?.backdrop_path, collection.value?.poster_path),
)

const yearSpan = computed(() => {
  const parts = orderedParts.value
  const years = parts
    .map(p => (p.release_date || '').slice(0, 4))
    .filter(y => /^\d{4}$/.test(y))
  if (!years.length) return ''
  const first = years[0]
  const last = years[years.length - 1]
  return first === last ? first : `${first} – ${last}`
})

const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

useHead(() => ({
  title: collection.value?.name
    ? `${collection.value.name} — Orbitra`
    : 'Collection — Orbitra',
}))
</script>
