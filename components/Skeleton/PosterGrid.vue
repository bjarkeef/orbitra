<template>
  <div
    :class="gridClass"
    aria-busy="true"
  >
    <div
      v-for="n in count"
      :key="n"
      class="rounded-xl bg-slate-800/80 ring-1 ring-slate-700/50 overflow-hidden animate-pulse"
    >
      <div class="aspect-poster bg-slate-700/70" />
      <div class="p-2 space-y-2">
        <div class="h-3 w-4/5 rounded bg-slate-700/60" />
        <div class="h-2.5 w-1/2 rounded bg-slate-700/40" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  count: { type: Number, default: 12 },
  cols: { type: String, default: '2 md:3 lg:4 xl:5 2xl:6' },
})

const gridClass = computed(() => {
  // Prefer shared utilities; keep named presets for smaller grids
  const map = {
    '2 md:3 lg:4 xl:5 2xl:6': 'poster-grid',
    '2 md:3 lg:4': 'poster-grid-sm',
  }
  return map[props.cols] || 'poster-grid'
})
</script>
