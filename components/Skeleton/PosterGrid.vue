<template>
  <div :class="gridClass" aria-busy="true">
    <div
      v-for="n in count"
      :key="n"
      class="group block rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800/80 animate-pulse"
    >
      <!-- Matches HomePosterCard: poster only + score chip -->
      <div class="relative aspect-poster bg-slate-800/90">
        <div class="absolute inset-0 bg-slate-700/50" />
        <div
          class="absolute top-2 right-2 h-6 w-11 rounded-md bg-slate-900/70 ring-1 ring-slate-600/40"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    count?: number
    /** Named preset or falls back to full poster-grid */
    cols?: string
  }>(),
  {
    count: 12,
    cols: '2 md:3 lg:4 xl:5 2xl:6',
  },
)

const gridClass = computed(() => {
  const map: Record<string, string> = {
    '2 md:3 lg:4 xl:5 2xl:6': 'poster-grid',
    '2 md:3 lg:4': 'poster-grid-sm',
  }
  return map[props.cols] || 'poster-grid'
})
</script>
