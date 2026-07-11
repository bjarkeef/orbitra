<template>
  <div
    v-if="node"
    class="p-4 rounded-xl bg-slate-900/80 border border-slate-700 flex flex-wrap gap-4 items-start"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="node.label"
      width="64"
      height="64"
      class="w-16 h-16 rounded-lg object-cover bg-slate-800"
      loading="lazy"
      decoding="async"
    />
    <div class="flex-1 min-w-0">
      <p class="text-xs uppercase tracking-wide text-slate-500 mb-0.5">
        {{ typeLabel }}
      </p>
      <h4 class="text-lg font-bold text-slate-100">{{ node.label }}</h4>
      <p v-if="node.year || node.character || node.collabCount" class="text-sm text-slate-400 mt-0.5">
        <template v-if="node.year">{{ node.year }}</template>
        <template v-if="node.character">
          <span v-if="node.year"> · </span>as {{ node.character }}
        </template>
        <template v-if="node.collabCount && node.collabCount >= 2">
          <span v-if="node.year || node.character"> · </span>{{ node.collabCount }} shared titles
        </template>
      </p>
      <p v-if="node.voteAverage" class="text-xs text-slate-500 mt-1">
        ★ {{ Number(node.voteAverage).toFixed(1) }}
        <span v-if="node.voteCount"> · {{ Number(node.voteCount).toLocaleString() }} votes</span>
      </p>

      <ul
        v-if="sharedTitles?.length"
        class="mt-3 space-y-1 list-none p-0 m-0"
      >
        <li
          v-for="t in sharedTitles"
          :key="t.mediaType + '-' + t.id"
          class="text-xs text-slate-400"
        >
          <NuxtLink
            :to="t.mediaType === 'tv' ? '/tv/' + t.id : '/m/' + t.id"
            class="text-indigo-300 hover:text-indigo-200"
          >
            {{ t.title }}
          </NuxtLink>
          <span v-if="t.year" class="text-slate-600"> · {{ t.year }}</span>
        </li>
      </ul>
    </div>
    <div class="flex flex-col gap-2 shrink-0">
      <NuxtLink
        v-if="node.type === 'project'"
        :to="projectHref"
        class="btn-secondary"
      >
        Open {{ node.mediaType === 'tv' ? 'show' : 'movie' }}
      </NuxtLink>
      <template v-else-if="node.type !== 'actor' && node.tmdbId">
        <NuxtLink
          :to="'/actor/' + node.tmdbId + '?view=orbit'"
          class="btn-secondary"
        >
          Open person
        </NuxtLink>
        <button
          type="button"
          class="btn-secondary bg-rose-600 hover:bg-rose-500"
          @click="$emit('recenter', node.tmdbId)"
        >
          Make center
        </button>
      </template>
    </div>
  </div>
  <div
    v-else
    class="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-sm text-slate-500"
  >
    Click a node on the graph (or pick from the list) to inspect it.
  </div>
</template>

<script setup lang="ts">
import type { GraphSharedTitle } from '~/utils/orbitTypes'

const props = defineProps<{
  node: Record<string, any> | null
  sharedTitles?: GraphSharedTitle[]
}>()

defineEmits<{
  recenter: [tmdbId: number]
}>()

const { imageUrl } = useTmdb()

const imageSrc = computed(() =>
  props.node?.image ? imageUrl(props.node.image, 'w185') : '',
)

const typeLabel = computed(() => {
  const n = props.node
  if (!n) return ''
  if (n.type === 'actor') return 'Person (center)'
  if (n.type === 'project') return n.mediaType === 'tv' ? 'TV show' : 'Movie'
  if (n.type === 'repeat') return 'Repeat collaborator'
  return 'Co-star'
})

const projectHref = computed(() => {
  const n = props.node
  if (!n || n.type !== 'project') return '/'
  return n.mediaType === 'tv' ? `/tv/${n.tmdbId}` : `/m/${n.tmdbId}`
})
</script>
