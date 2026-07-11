<template>
  <div class="orbit-stage space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300/90">
          Co-star orbit
        </p>
        <h2 class="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">
          {{ title }}
        </h2>
        <p class="text-xs text-slate-500 mt-1 max-w-xl">
          Server-built collaboration graph — posters &amp; faces on the canvas, list companion for accessibility.
        </p>
      </div>
      <ActorOrbitFilters
        v-model:media="media"
        v-model:rank="rank"
        v-model:year-from="yearFrom"
        v-model:year-to="yearTo"
        :year-span="insights?.yearSpan"
        :truncated="truncated"
        @expand="expandDensity"
      />
    </div>

    <ActorOrbitInsightsPanel
      :insights="insights"
      :truncated="truncated"
    />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
      <ActorGraph
        :person-id="personId"
        :height="height"
        :max-projects="maxProjects"
        :top-cast-per-project="topCast"
        :media="media"
        :rank="rank"
        :year-from="yearFrom"
        :year-to="yearTo"
        :selected-id="selectedId"
        @select="onSelect"
        @insights="onInsights"
        @built="onBuilt"
      />

      <div class="space-y-3">
        <ActorOrbitNodePanel
          :node="selectedNode"
          :shared-titles="sharedForSelected"
          @recenter="onRecenter"
        />
        <ActorOrbitNodeList
          :nodes="nodes"
          :selected-id="selectedId"
          @select="onSelectFromList"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GraphNode, GraphPayload, OrbitMediaFilter, OrbitRankMode } from '~/utils/orbitTypes'
import type { OrbitSimNode } from '~/utils/orbitSimTypes'
import { orbitGraphDefaults } from '~/utils/orbitSim'
import {
  orbitQueryFromRouteQuery,
  orbitQueryToRoutePatch,
} from '~/utils/orbitQuery'

const props = defineProps<{
  personId: number | string
  personName?: string
  /** Sync filters/selection to the route query */
  syncRoute?: boolean
}>()

const route = useRoute()
const router = useRouter()

const caps = orbitGraphDefaults(import.meta.client ? window.innerWidth : 1024)
const maxProjects = ref(caps.maxProjects)
const topCast = ref(caps.topCastPerProject)
const height = caps.height

const media = ref<OrbitMediaFilter>('all')
const rank = ref<OrbitRankMode>('popular')
const yearFrom = ref<number | null>(null)
const yearTo = ref<number | null>(null)

const insights = ref<GraphPayload['insights'] | null>(null)
const truncated = ref(false)
const nodes = ref<GraphNode[]>([])
const selectedId = ref<string | null>(null)
const selectedNode = ref<OrbitSimNode | GraphNode | null>(null)

const title = computed(() =>
  props.personName ? `${props.personName}'s orbit` : 'Orbit graph',
)

const sharedForSelected = computed(() => {
  const n = selectedNode.value
  if (!n || (n.type !== 'repeat' && n.type !== 'costar')) return []
  const collab = insights.value?.topCollaborators?.find(c => c.tmdbId === n.tmdbId)
  return collab?.sharedTitles || []
})

// Hydrate from route once
if (props.syncRoute) {
  const q = orbitQueryFromRouteQuery(route.query as Record<string, unknown>, {
    maxProjects: caps.maxProjects,
    topCast: caps.topCastPerProject,
  })
  media.value = q.media
  rank.value = q.rank
  yearFrom.value = q.yearFrom
  yearTo.value = q.yearTo
  maxProjects.value = q.maxProjects
  topCast.value = q.topCast
  if (typeof route.query.node === 'string') selectedId.value = route.query.node
}

function pushRoute() {
  if (!props.syncRoute) return
  const patch = orbitQueryToRoutePatch(
    {
      maxProjects: maxProjects.value,
      topCast: topCast.value,
      media: media.value,
      rank: rank.value,
      yearFrom: yearFrom.value,
      yearTo: yearTo.value,
    },
    { maxProjects: caps.maxProjects, topCast: caps.topCastPerProject },
  )
  router.replace({
    query: {
      ...route.query,
      ...patch,
      node: selectedId.value || undefined,
      view: route.query.view || 'orbit',
    },
  })
}

watch([media, rank, yearFrom, yearTo, maxProjects, topCast, selectedId], () => {
  pushRoute()
})

function onSelect(node: OrbitSimNode | null) {
  selectedNode.value = node
  selectedId.value = node?.id || null
}

function onSelectFromList(node: GraphNode) {
  selectedNode.value = node as OrbitSimNode
  selectedId.value = node.id
}

function onInsights(val: GraphPayload['insights'] | null) {
  insights.value = val
}

function onBuilt(graph: GraphPayload) {
  truncated.value = !!graph.truncated
  nodes.value = graph.nodes || []
  // re-bind selection if still present
  if (selectedId.value) {
    const n = graph.nodes.find(x => x.id === selectedId.value)
    selectedNode.value = n || null
    if (!n) selectedId.value = null
  }
}

function expandDensity() {
  maxProjects.value = Math.min(40, maxProjects.value + 8)
  topCast.value = Math.min(12, topCast.value + 2)
}

function onRecenter(tmdbId: number) {
  navigateTo({ path: `/orbit/${tmdbId}`, query: { view: 'orbit' } })
}
</script>
