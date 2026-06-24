<template>
  <div>
    <SkeletonDetailPage v-if="pending && !movie" />

    <div v-else-if="errorMsg && !movie" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this collection</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>

    <div v-else-if="movie" class="movie pb-5">
      <div
        class="banner bg-cover bg-no-repeat bg-center relative h-56 sm:h-72 md:h-96"
        :style="backdropImgPath"
      />
      <div
        class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg"
      >
        <div class="w-full gap-6 flex xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full" :object="movie" mtype="collection" />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden">
          <MTitle :movie="movie" />
          <div v-if="movie.parts" class="seasons mt-3">
            <h3 class="text-2xl mb-2 font-bold">Movies in collection</h3>
            <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
              <NuxtLink
                v-for="part in movie.parts"
                :key="part.id"
                class="bg-slate-800 p-4 rounded-md flex gap-3 flex-shrink-0 max-w-full"
                :to="'/m/' + part.id"
              >
                <div class="w-1/3">
                  <img
                    v-if="part.poster_path"
                    :src="'https://image.tmdb.org/t/p/w500/' + part.poster_path"
                    :alt="part.title"
                    class="rounded-md w-full"
                    loading="lazy"
                  />
                  <img
                    v-else
                    class="bg-slate-900 rounded-md"
                    src="@/assets/img/noPoster.png"
                    alt="No Poster"
                  />
                </div>
                <div class="w-2/3 min-w-0">
                  <h3 class="text-xl mb-2 font-bold">{{ part.title }}</h3>
                  <p class="text-sm mb-2 line-clamp-3">{{ part.overview }}</p>
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
const { getCollection, backdropStyle } = useTmdb()

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
</script>

<style scoped>
.banner:before {
  content: '';
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
