<template>
  <div>
    <div v-if="loading">
      <div class="bg-slate-700 shadow rounded-md p-4 h-96 w-full mx-auto animate-pulse" />
      <div class="details w-2/3 mx-auto p-6 mt-5 bg-slate-700 shadow rounded-lg h-96 animate-pulse" />
    </div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this person</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <NuxtLink to="/" class="underline text-indigo-400">Back home</NuxtLink>
    </div>
    <div v-else-if="person">
      <div class="actor pb-5">
        <div class="banner bg-cover bg-no-repeat bg-center relative h-96" :style="backdropImgPath" />
        <div class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
          <div class="w-full gap-6 flex xl:block xl:w-1/3">
            <Poster class="w-1/3 xl:w-full" :object="person" mtype="person" />
            <Information mtype="person" class="w-2/3 xl:w-full" :object="person" />
          </div>
          <div class="w-full xl:w-2/3 overflow-hidden">
            <div class="bg-slate-800 w-full rounded-lg p-5">
              <h1 class="text-4xl font-bold mb-2">{{ person.name }}</h1>
              <hr class="border-slate-900 border-opacity-50 mb-4" />
              <p>{{ person.biography }}</p>
            </div>
            <div class="bg-slate-800 rounded-lg p-5 mt-6">
              <h3 class="text-2xl font-bold mb-2">Filmography</h3>
              <p class="text-xs text-slate-500 mb-4">Co-star orbit ships on branch orbitra-phase-2.</p>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MMovie v-for="c in credits.slice(0, 24)" :key="c.id + '-' + (c.credit_id || '')" :movie="c" :mtype="c.media_type" />
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
const { getPerson, getPersonCombinedCredits, backdropStyle } = useTmdb()
const id = computed(() => String(route.params.pid || ''))

const { data, pending: loading, error: asyncError } = await useAsyncData(
  () => `person-${id.value}`,
  async () => {
    const pid = id.value
    if (!/^\d+$/.test(pid)) throw createError({ statusCode: 400, statusMessage: 'Invalid person id' })
    const [person, creditsPayload] = await Promise.all([getPerson(pid), getPersonCombinedCredits(pid)])
    const credits = (creditsPayload.cast || []).slice().sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    const withBackdrop = credits.filter((c) => c.backdrop_path)
    let backdropImgPath = { backgroundImage: '' }
    if (withBackdrop.length) {
      const pick = withBackdrop[Math.floor(Math.random() * withBackdrop.length)]
      backdropImgPath = backdropStyle(pick.backdrop_path)
    }
    return { person, credits, backdropImgPath }
  },
  { watch: [id] },
)

const person = computed(() => data.value?.person ?? null)
const credits = computed(() => data.value?.credits ?? [])
const backdropImgPath = computed(() => data.value?.backdropImgPath ?? { backgroundImage: '' })
const error = computed(() => (!asyncError.value ? null : (asyncError.value?.statusMessage || asyncError.value?.message || 'Unknown error')))
</script>

<style scoped>
.banner:before { content: ''; background-color: rgba(0,0,0,.8); width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
</style>
