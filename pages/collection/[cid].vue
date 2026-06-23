<template>
  <div>
    <div v-if="loading"><div class="bg-slate-700 shadow rounded-md p-4 h-96 w-full mx-auto animate-pulse" /></div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this collection</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>
    <div v-else-if="collection">
      <div class="pb-5">
        <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
        <div class="details w-11/12 xl:w-2/3 mx-auto p-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
          <div class="bg-slate-800 rounded-lg p-5 mb-6">
            <h1 class="text-4xl font-bold mb-2">{{ collection.name }}</h1>
            <p>{{ collection.overview }}</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <NuxtLink v-for="part in collection.parts || []" :key="part.id" :to="'/m/' + part.id" class="bg-slate-800 rounded-md overflow-hidden">
              <img v-if="part.poster_path" :src="img(part.poster_path)" :alt="part.title" class="w-full" loading="lazy" />
              <img v-else src="@/assets/img/noPoster.png" alt="No poster" class="w-full" />
              <p class="p-2 text-sm font-semibold truncate">{{ part.title }}</p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getCollection, backdropStyle, imageUrl } = useTmdb()
const id = computed(() => String(route.params.cid || ''))
const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `collection-${id.value}`,
  async () => {
    const cid = id.value
    if (!/^\d+$/.test(cid)) throw createError({ statusCode: 400, statusMessage: 'Invalid collection id' })
    const collection = await getCollection(cid)
    return { collection, backdropImgPath: backdropStyle(collection.backdrop_path) }
  },
  { watch: [id] },
)
const collection = computed(() => data.value?.collection ?? null)
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
function img(path) { return imageUrl(path, 'w500') }
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
