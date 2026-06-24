<template>
  <div>
    <SkeletonDetailPage v-if="pending && !movie" />

    <div v-else-if="errorMsg && !movie" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this collection</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="movie" class="movie pb-8">
      <div
        class="media-banner"
        :style="backdropImgPath"
      />
      <div class="detail-panel">
        <div class="w-full gap-6 flex xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full" :object="movie" mtype="collection" />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden min-w-0">
          <MTitle :movie="movie" />
          <div v-if="movie.parts" class="seasons mt-6">
            <h3 class="text-2xl mb-3 font-bold text-slate-100">Movies in collection</h3>
            <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
              <NuxtLink
                v-for="part in movie.parts"
                :key="part.id"
                class="list-card"
                :to="'/m/' + part.id"
              >
                <div class="w-1/3 shrink-0">
                  <img
                    v-if="posterSrc(part)"
                    :src="posterSrc(part)"
                    :alt="part.title"
                    class="rounded-md w-full bg-slate-900"
                    loading="lazy"
                  />
                  <img
                    v-else
                    class="bg-slate-900 rounded-md w-full"
                    src="@/assets/img/noPoster.png"
                    alt="No Poster"
                  />
                </div>
                <div class="w-2/3 min-w-0">
                  <h3 class="text-lg sm:text-xl mb-2 font-bold text-slate-100">{{ part.title }}</h3>
                  <p class="text-sm mb-2 text-slate-400 line-clamp-3">{{ part.overview }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getCollection, backdropStyle, imageUrl } = useTmdb()

const id = computed(() => String(route.params.cid))

const {
  data: movie,
  pending,
  error,
} = useLazyAsyncData(
  () => `collection-${id.value}`,
  () => getCollection(id.value),
  { watch: [id] },
)

const backdropImgPath = computed(() => backdropStyle(movie.value?.backdrop_path))
const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

function posterSrc(part) {
  return imageUrl(part?.poster_path, 'w500')
}
</script>
