<template>
  <section class="home-hero relative w-full overflow-hidden bg-slate-950">
    <!-- Backdrop -->
    <div class="absolute inset-0">
      <Transition name="hero-fade" mode="out-in">
        <div
          v-if="current"
          :key="current.id"
          class="absolute inset-0 bg-cover bg-center scale-105"
          :style="backdropStyle(current.backdrop_path || current.poster_path)"
        />
      </Transition>
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
    </div>

    <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 min-h-hero sm:min-h-hero-sm flex flex-col justify-end pb-10 pt-20">
      <p class="text-xs uppercase tracking-hero text-indigo-300/90 mb-3">Now featuring</p>

      <div v-if="loading" class="space-y-3 max-w-xl animate-pulse">
        <div class="h-10 bg-slate-800/80 rounded w-2/3" />
        <div class="h-4 bg-slate-800/60 rounded w-full" />
        <div class="h-4 bg-slate-800/60 rounded w-5/6" />
        <div class="h-10 bg-slate-800/70 rounded w-36 mt-4" />
      </div>

      <div v-else-if="error" class="max-w-lg">
        <p class="text-slate-300">Could not load featured titles.</p>
        <button type="button" class="mt-3 btn-ghost" @click="refresh()">Try again</button>
      </div>

      <template v-else>
        <div class="max-w-2xl min-h-hero-copy sm:min-h-hero-copy-sm">
          <!-- Only title / copy / CTA rotate — pagination stays mounted -->
          <Transition name="hero-fade" mode="out-in">
            <div v-if="current" :key="'copy-' + current.id">
              <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight drop-shadow">
                {{ titleOf(current) }}
              </h1>
              <p
                v-if="current.overview"
                class="mt-4 text-sm sm:text-base text-slate-300/90 line-clamp-3 max-w-xl leading-relaxed"
              >
                {{ current.overview }}
              </p>
              <div class="mt-6 flex flex-wrap items-center gap-3">
                <NuxtLink
                  :to="linkOf(current)"
                  class="btn-primary"
                >
                  View details
                </NuxtLink>
                <span v-if="scoreOf(current)" class="text-sm text-slate-400">
                  ★ {{ scoreOf(current) }}
                  <span v-if="yearOf(current)" class="text-slate-500"> · {{ yearOf(current) }}</span>
                </span>
              </div>
            </div>
          </Transition>
        </div>

        <div
          v-if="slides.length"
          class="mt-8 flex gap-2"
          role="tablist"
          aria-label="Featured slides"
        >
          <button
            v-for="(item, i) in slides"
            :key="item.id"
            type="button"
            role="tab"
            :aria-selected="i === index"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="i === index ? 'w-8 bg-indigo-400' : 'w-3 bg-slate-600 hover:bg-slate-500'"
            :aria-label="'Show ' + titleOf(item)"
            @click="go(i)"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
const { getNowPlaying, backdropStyle } = useTmdb()

const { data, pending: loading, error: fetchError, refresh } = useLazyAsyncData('home-hero-now-playing', async () => {
  const res = await getNowPlaying(1)
  return (res.results || []).filter(m => m.backdrop_path || m.poster_path).slice(0, 8)
})

const slides = computed(() => data.value || [])
const error = computed(() => (fetchError.value ? (fetchError.value.statusMessage || fetchError.value.message) : null))
const index = ref(0)
let timer = null

const current = computed(() => slides.value[index.value] || null)

function titleOf(m) {
  return m?.title || m?.name || 'Untitled'
}
function linkOf(m) {
  if (m?.media_type === 'tv') return `/tv/${m.id}`
  return `/m/${m.id}`
}
function scoreOf(m) {
  const v = m?.vote_average
  if (v == null || Number.isNaN(Number(v))) return ''
  return Number(v).toFixed(1)
}
function yearOf(m) {
  const d = m?.release_date || m?.first_air_date || ''
  return d.slice(0, 4)
}

function go(i) {
  index.value = i
  restart()
}

function tick() {
  if (slides.value.length < 2) return
  index.value = (index.value + 1) % slides.value.length
}

function restart() {
  if (timer) clearInterval(timer)
  if (import.meta.client && slides.value.length > 1) {
    timer = setInterval(tick, 7000)
  }
}

watch(slides, () => {
  index.value = 0
  restart()
})

onMounted(() => restart())
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.55s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
</style>
