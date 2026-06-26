<template>
  <div class="xl:mt-6 space-y-4">
    <NuxtLink
      :to="'/collection/' + movie.belongs_to_collection.id"
      :style="backdropImgPath"
      class="rounded-lg p-5 flex min-h-20 relative bg-cover bg-no-repeat bg-center overflow-hidden ring-1 ring-slate-700/50 block"
    >
      <div class="absolute inset-0 backdrop-blur-sm hover:backdrop-blur-0 transition-all duration-500 bg-black/50" />
      <div class="z-10 relative">
        <h2 class="text-lg sm:text-xl font-semibold text-slate-100">
          Part of the {{ movie.belongs_to_collection.name }}
        </h2>
        <p v-if="progressLine" class="text-xs text-indigo-200/90 mt-1">
          {{ progressLine }}
        </p>
        <p class="text-xs text-slate-400 mt-1">View full collection page</p>
      </div>
    </NuxtLink>

    <div v-if="collectionPending" class="section-card animate-pulse h-32" />
    <div v-else-if="collection" class="section-card">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 class="text-lg font-bold text-slate-100">Collection — watch order</h3>
        <NuxtLink
          :to="'/collection/' + movie.belongs_to_collection.id"
          class="btn-ghost text-xs"
        >
          Open collection
        </NuxtLink>
      </div>
      <CollectionParts
        :collection="collection"
        :highlight-id="movie.id"
      />
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

const { getCollection, backdropStyle, sortCollectionParts } = useTmdb()
const { progressForIds } = useMovieRatings()

const backdropImgPath = computed(() =>
  backdropStyle(props.movie?.belongs_to_collection?.backdrop_path),
)

const collectionId = computed(() => props.movie?.belongs_to_collection?.id)

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

const progressLine = computed(() => {
  const parts = sortCollectionParts(collection.value?.parts || [])
  if (!parts.length) return ''
  const { rated, total, complete } = progressForIds(parts.map((p) => p.id))
  if (!rated) return `${total} films in series`
  if (complete) return `You rated all ${total}`
  return `You have seen ${rated} of ${total} in this series`
})
</script>
