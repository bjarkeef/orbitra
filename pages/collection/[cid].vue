<template>
  <div>
    <SkeletonDetailPage v-if="pending && !collection" />

    <div v-else-if="errorMsg && !collection" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this collection</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <NuxtLink to="/collections" class="btn-ghost mr-4">Browse collections</NuxtLink>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="collection" class="movie pb-8">
      <div
        class="media-banner"
        :style="backdropImgPath"
      />
      <div class="detail-panel !flex-col">
        <div class="flex flex-col sm:flex-row gap-6 w-full">
          <Poster class="w-1/3 sm:w-48 shrink-0" :object="collection" mtype="collection" />
          <div class="section-card flex-1 min-w-0">
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400/90">Collection</p>
            <h1 class="text-3xl sm:text-4xl font-bold text-slate-100 mt-1">{{ collection.name }}</h1>
            <p v-if="collection.overview" class="mt-3 text-slate-300 leading-relaxed">
              {{ collection.overview }}
            </p>
            <p class="mt-3 text-sm text-slate-500">
              {{ orderedParts.length }} titles · watch order by release date
            </p>
            <NuxtLink to="/collections" class="btn-ghost text-sm mt-3 inline-block">
              Browse all collections
            </NuxtLink>
          </div>
        </div>

        <div class="section-card w-full mt-2">
          <h2 class="text-2xl font-bold text-slate-100 mb-4">Films in order</h2>
          <CollectionParts :collection="collection" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getCollection, backdropStyle, sortCollectionParts } = useTmdb()

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

const backdropImgPath = computed(() => backdropStyle(collection.value?.backdrop_path))
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
