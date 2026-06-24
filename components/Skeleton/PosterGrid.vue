<template>
  <div
    class="grid gap-4 sm:gap-6"
    :class="gridClass"
    aria-busy="true"
  >
    <div
      v-for="n in count"
      :key="n"
      class="rounded-xl bg-slate-800/80 ring-1 ring-slate-700/50 overflow-hidden animate-pulse"
    >
      <div class="aspect-[2/3] bg-slate-700/70" />
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
  // Tailwind needs full class names at build time — map common presets
  const map = {
    '2 md:3 lg:4 xl:5 2xl:6': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    '2 md:3 lg:4': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }
  return map[props.cols] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
})
</script>
