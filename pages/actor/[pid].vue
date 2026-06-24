<template>
  <div>
    <SkeletonDetailPage v-if="pending && !person" />

    <div v-else-if="errorMsg && !person" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this person</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="underline text-indigo-400 mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>

    <div v-else-if="person" class="actor pb-5">
      <div
        class="banner bg-cover bg-no-repeat bg-center relative h-56 sm:h-72 md:h-96"
        :style="backdropImgPath"
      />
      <div
        class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg"
      >
        <div class="w-full gap-6 flex xl:block xl:w-1/3">
          <Poster class="w-1/3 xl:w-full" :object="person" mtype="person" />
          <Information mtype="person" class="w-2/3 xl:w-full" :object="person" />
        </div>
        <div class="w-full xl:w-2/3 overflow-hidden">
          <div class="flex gap-6">
            <div class="bg-slate-800 w-full rounded-lg p-5">
              <h1 class="text-4xl font-bold mb-2">{{ person.name }}</h1>
              <hr class="border-slate-900 border-opacity-50 mb-4" />
              <p class="whitespace-pre-line">{{ person.biography }}</p>
            </div>
          </div>

          <div class="bg-slate-800 rounded-lg p-5 mt-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 class="text-2xl font-bold">
                {{ viewMode === 'graph' ? 'Co-star orbit' : 'Filmography' }}
              </h3>
              <div class="flex rounded-lg overflow-hidden border border-slate-600 text-sm">
                <button
                  type="button"
                  class="px-3 py-1.5 transition"
                  :class="viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                  @click="viewMode = 'grid'"
                >
                  Grid
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 transition"
                  :class="viewMode === 'graph' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                  @click="viewMode = 'graph'"
                >
                  Orbit
                </button>
              </div>
            </div>

            <div v-if="viewMode === 'graph'">
              <ActorGraph
                :person-id="person.id"
                :max-projects="maxProjects"
                :top-cast-per-project="topCastPerProject"
                @select="onNodeSelect"
                @insights="onInsights"
              />

              <div
                v-if="selectedNode"
                class="mt-4 p-4 rounded-lg bg-slate-900/80 border border-slate-700 flex flex-wrap gap-4 items-start"
              >
                <img
                  v-if="selectedNode.image"
                  :src="nodeImage(selectedNode)"
                  :alt="selectedNode.label"
                  class="w-16 h-16 rounded-lg object-cover bg-slate-800"
                />
                <div
                  v-else
                  class="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-2xl"
                >
                  {{ selectedNode.type === 'project' ? 'F' : 'P' }}
                </div>
                <div class="flex-1 min-w-[12rem]">
                  <p class="text-xs uppercase tracking-wide text-slate-500 mb-0.5">
                    {{ nodeTypeLabel(selectedNode) }}
                  </p>
                  <h4 class="text-lg font-bold">{{ selectedNode.label }}</h4>
                  <p v-if="selectedNode.year" class="text-sm text-slate-400">
                    {{ selectedNode.year }}
                    <span v-if="selectedNode.character"> · as {{ selectedNode.character }}</span>
                  </p>
                  <p v-if="selectedNode.collabCount" class="text-sm text-rose-300 mt-1">
                    Collaborated {{ selectedNode.collabCount }} times with {{ person.name }}
                  </p>
                  <p v-if="selectedNode.voteAverage" class="text-sm text-slate-400 mt-1">
                    ★ {{ selectedNode.voteAverage.toFixed(1) }}
                    <span v-if="selectedNode.voteCount"> · {{ selectedNode.voteCount.toLocaleString() }} votes</span>
                  </p>
                </div>
                <div class="flex gap-2">
                  <NuxtLink
                    v-if="selectedNode.type === 'project'"
                    :to="projectLink(selectedNode)"
                    class="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm"
                  >
                    Open {{ selectedNode.mediaType === 'tv' ? 'show' : 'movie' }}
                  </NuxtLink>
                  <NuxtLink
                    v-else-if="selectedNode.type !== 'actor'"
                    :to="'/actor/' + selectedNode.tmdbId"
                    class="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm"
                  >
                    Open person
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div v-else>
              <SkeletonPosterGrid v-if="creditsPending && !credits.length" :count="8" cols="2 md:3 lg:4" />
              <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MMovie
                  v-for="movie in credits.slice(0, 20)"
                  :key="movie.id + '-' + (movie.credit_id || movie.character || '')"
                  :movie="movie"
                  :mtype="movie.media_type"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { getPerson, getPersonCombinedCredits, backdropStyle, imageUrl: tmdbImage } = useTmdb()

const id = computed(() => String(route.params.pid))
const viewMode = ref('grid')
const selectedNode = ref(null)
const insights = ref(null)
const maxProjects = 24
const topCastPerProject = 8

const {
  data: person,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `person-${id.value}`,
  () => getPerson(id.value),
  { watch: [id] },
)

const {
  data: creditsRaw,
  pending: creditsPending,
} = useLazyAsyncData(
  () => `person-credits-${id.value}`,
  async () => {
    const payload = await getPersonCombinedCredits(id.value)
    return (payload.cast || [])
      .slice()
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
  },
  { watch: [id] },
)

const credits = computed(() => creditsRaw.value || [])

const backdropImgPath = computed(() => {
  const list = credits.value.filter((c) => c.backdrop_path)
  if (!list.length) return { backgroundImage: '' }
  return backdropStyle(list[0].backdrop_path)
})

const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

function onNodeSelect(node) {
  selectedNode.value = node
}
function onInsights(val) {
  insights.value = val
}
function nodeTypeLabel(n) {
  if (!n) return ''
  if (n.type === 'actor') return 'Actor (center)'
  if (n.type === 'project') return n.mediaType === 'tv' ? 'TV show' : 'Movie'
  if (n.type === 'repeat') return 'Repeat collaborator'
  return 'Co-star'
}
function nodeImage(n) {
  if (!n?.image) return ''
  return tmdbImage(n.image, 'w185')
}
function projectLink(n) {
  return n.mediaType === 'tv' ? `/tv/${n.tmdbId}` : `/m/${n.tmdbId}`
}
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
