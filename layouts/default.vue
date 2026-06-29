<template>
  <div class="orbitra-shell min-h-screen flex flex-col bg-slate-900">
    <!-- Thin route progress — shows while client navigates / payloads load -->
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-progress h-0.5 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="h-full origin-left bg-indigo-500 transition-transform duration-300 ease-out"
        :class="barClass"
        :style="barStyle"
      />
    </div>

    <UITheHeader />
    <div class="flex-1 text-slate-200 w-full min-h-0">
      <slot />
    </div>
    <UITheFooter />
  </div>
</template>

<script setup lang="ts">
const nuxtApp = useNuxtApp()
const loading = useState('orbitra-route-loading', () => false)
const progress = useState('orbitra-route-progress', () => 0)

let trickleTimer: ReturnType<typeof setInterval> | null = null

function startBar() {
  loading.value = true
  progress.value = 0.12
  if (trickleTimer) clearInterval(trickleTimer)
  trickleTimer = setInterval(() => {
    if (progress.value < 0.88) {
      progress.value += Math.random() * 0.08
    }
  }, 200)
}

function finishBar() {
  if (trickleTimer) clearInterval(trickleTimer)
  progress.value = 1
  setTimeout(() => {
    loading.value = false
    progress.value = 0
  }, 220)
}

onMounted(() => {
  nuxtApp.hook('page:start', startBar)
  nuxtApp.hook('page:finish', finishBar)
  nuxtApp.hook('page:loading:start', startBar)
  nuxtApp.hook('page:loading:end', finishBar)
})

onBeforeUnmount(() => {
  if (trickleTimer) clearInterval(trickleTimer)
})

const barClass = computed(() =>
  loading.value || progress.value > 0 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0',
)

const barStyle = computed(() => {
  const p = Math.min(1, Math.max(0.05, progress.value || (loading.value ? 0.15 : 0)))
  return { transform: `scaleX(${p})` }
})
</script>
