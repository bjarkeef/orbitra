<template>
  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
    <div class="flex rounded-lg overflow-hidden border border-slate-600 text-xs sm:text-sm" role="group" aria-label="Media filter">
      <button
        v-for="m in mediaOpts"
        :key="m.value"
        type="button"
        class="px-2.5 sm:px-3 py-1.5 transition-colors"
        :class="media === m.value ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
        @click="emit('update:media', m.value)"
      >
        {{ m.label }}
      </button>
    </div>

    <label class="flex items-center gap-1.5 text-xs text-slate-400">
      <span class="hidden sm:inline">Rank</span>
      <select
        class="rounded-md bg-slate-900 border border-slate-600 text-slate-200 text-xs sm:text-sm px-2 py-1.5"
        :value="rank"
        @change="emit('update:rank', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="popular">Popular</option>
        <option value="hybrid">Hybrid</option>
        <option value="recent">Recent</option>
        <option value="top_rated">Top rated</option>
      </select>
    </label>

    <label class="flex items-center gap-1.5 text-xs text-slate-400">
      <span class="hidden sm:inline">Era</span>
      <select
        class="rounded-md bg-slate-900 border border-slate-600 text-slate-200 text-xs sm:text-sm px-2 py-1.5 max-w-[9rem]"
        :value="decadeKey"
        @change="onDecade(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="d in decades"
          :key="d.label + String(d.from)"
          :value="decadeValue(d)"
        >
          {{ d.label }}
        </option>
      </select>
    </label>

    <button
      v-if="truncated"
      type="button"
      class="text-xs font-semibold text-amber-300 hover:text-amber-200 underline"
      @click="emit('expand')"
    >
      Show more titles
    </button>
  </div>
</template>

<script setup lang="ts">
import type { OrbitMediaFilter, OrbitRankMode } from '~/utils/orbitTypes'
import { orbitDecadeOptions } from '~/utils/orbitQuery'

const props = defineProps<{
  media: OrbitMediaFilter
  rank: OrbitRankMode
  yearFrom: number | null
  yearTo: number | null
  yearSpan?: { min: number, max: number } | null
  truncated?: boolean
}>()

const emit = defineEmits<{
  'update:media': [v: OrbitMediaFilter]
  'update:rank': [v: OrbitRankMode]
  'update:yearFrom': [v: number | null]
  'update:yearTo': [v: number | null]
  'expand': []
}>()

const mediaOpts = [
  { value: 'all' as const, label: 'All' },
  { value: 'movie' as const, label: 'Movies' },
  { value: 'tv' as const, label: 'TV' },
]

const decades = computed(() => orbitDecadeOptions(props.yearSpan))

function decadeValue(d: { from: number | null, to: number | null }) {
  return d.from == null ? 'all' : `${d.from}-${d.to}`
}

const decadeKey = computed(() => {
  if (props.yearFrom == null) return 'all'
  return `${props.yearFrom}-${props.yearTo ?? props.yearFrom + 9}`
})

function onDecade(val: string) {
  if (val === 'all') {
    emit('update:yearFrom', null)
    emit('update:yearTo', null)
    return
  }
  const [a, b] = val.split('-').map(Number)
  emit('update:yearFrom', a)
  emit('update:yearTo', b)
}
</script>
