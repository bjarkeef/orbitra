<template>
  <div
    v-if="insights"
    class="rounded-xl bg-slate-900/80 ring-1 ring-slate-700/70 p-4 sm:p-5 space-y-4"
  >
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 class="text-sm font-bold text-slate-100 uppercase tracking-wide">Orbit insights</h3>
        <p class="text-xs text-slate-500 mt-0.5">
          Built from top titles and co-stars · click a node for detail
        </p>
      </div>
      <p v-if="truncated" class="text-xs text-amber-400/90 font-medium">Graph truncated for speed</p>
    </div>

    <dl class="grid grid-cols-3 gap-2 sm:gap-3">
      <div class="rounded-lg bg-slate-950/70 ring-1 ring-slate-800 px-3 py-2 text-center">
        <dt class="text-[10px] uppercase tracking-wide text-slate-500">Projects</dt>
        <dd class="text-lg sm:text-xl font-black text-amber-200 tabular-nums">
          {{ insights.totalProjects }}
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/70 ring-1 ring-slate-800 px-3 py-2 text-center">
        <dt class="text-[10px] uppercase tracking-wide text-slate-500">Co-stars</dt>
        <dd class="text-lg sm:text-xl font-black text-emerald-300 tabular-nums">
          {{ insights.totalCostars }}
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/70 ring-1 ring-slate-800 px-3 py-2 text-center">
        <dt class="text-[10px] uppercase tracking-wide text-slate-500">Repeat</dt>
        <dd class="text-lg sm:text-xl font-black text-rose-300 tabular-nums">
          {{ insights.repeatCollaborators }}
        </dd>
      </div>
    </dl>

    <div v-if="topCollaborators.length">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Top collaborators
      </p>
      <ul class="flex flex-wrap gap-2 list-none p-0 m-0">
        <li v-for="c in topCollaborators" :key="c.tmdbId">
          <NuxtLink
            :to="'/actor/' + c.tmdbId"
            class="inline-flex items-center gap-2 rounded-full bg-slate-950/80 ring-1 ring-slate-700/80 pl-1 pr-3 py-1 hover:ring-indigo-400/50 transition-colors"
          >
            <img
              v-if="c.imageUrl"
              :src="c.imageUrl"
              :alt="c.label"
              width="28"
              height="28"
              class="w-7 h-7 rounded-full object-cover bg-slate-800"
              loading="lazy"
              decoding="async"
            />
            <span
              v-else
              class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500"
            >?</span>
            <span class="text-xs font-semibold text-slate-200 max-w-[8rem] truncate">{{ c.label }}</span>
            <span class="text-[10px] font-bold text-rose-300/90 tabular-nums">×{{ c.collabCount }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GraphInsights } from '~/utils/orbitTypes'

export type OrbitInsights = GraphInsights

const props = defineProps<{
  insights: OrbitInsights | null
  truncated?: boolean
}>()

const { imageUrl } = useTmdb()

const topCollaborators = computed(() =>
  (props.insights?.topCollaborators || []).slice(0, 8).map(c => ({
    ...c,
    imageUrl: c.image ? imageUrl(c.image, 'w185') : '',
  })),
)
</script>
