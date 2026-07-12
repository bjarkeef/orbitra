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
          Physics motion is off by default; turn it on when you want a living graph.
        </p>
      </div>
      <div class="flex flex-col items-stretch sm:items-end gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn-secondary text-xs !py-1.5 !px-3"
            :class="animate ? 'ring-1 ring-indigo-400/50' : ''"
            :aria-pressed="animate"
            :title="animate ? 'Stop physics motion' : 'Start physics motion'"
            @click="animate = !animate"
          >
            {{ animate ? 'Motion on' : 'Motion off' }}
          </button>
          <button
            type="button"
            class="btn-secondary text-xs !py-1.5 !px-3"
            :disabled="shareBusy"
            :title="shareTitle"
            @click="shareOrbit"
          >
            {{ shareLabel }}
          </button>
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
    </div>

    <ActorOrbitInsightsPanel
      :insights="insights"
      :truncated="truncated"
    />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
      <LazyActorGraph
        v-model:animate="animate"
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
/** Physics motion — off by default; user opt-in (not URL-synced). */
const animate = ref(false)
const shareBusy = ref(false)
const shareFeedback = ref<'idle' | 'copied' | 'shared' | 'failed'>('idle')
let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const title = computed(() =>
  props.personName ? `${props.personName}'s orbit` : 'Orbit graph',
)

const shareLabel = computed(() => {
  if (shareFeedback.value === 'copied') return 'Link copied'
  if (shareFeedback.value === 'shared') return 'Shared'
  if (shareFeedback.value === 'failed') return 'Copy failed'
  return 'Share link'
})

const shareTitle = computed(() =>
  'Copy a shareable URL for this orbit (filters + selected node)',
)

function buildShareUrl(): string {
  if (!import.meta.client) return ''
  // Canonical share target is always /orbit/:id so links open the dedicated orbit page.
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
  const query: Record<string, string> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (v != null && v !== '') query[k] = v
  }
  if (selectedId.value) query.node = selectedId.value
  const qs = new URLSearchParams(query).toString()
  const path = `/orbit/${props.personId}${qs ? `?${qs}` : ''}`
  return new URL(path, window.location.origin).href
}

async function shareOrbit() {
  if (!import.meta.client || shareBusy.value) return
  shareBusy.value = true
  const url = buildShareUrl()
  try {
    // Prefer native share on mobile; fall back to clipboard.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: title.value,
          text: `${title.value} on Orbitra`,
          url,
        })
        setShareFeedback('shared')
        return
      }
      catch (err: unknown) {
        // User cancel — don't treat as failure; try clipboard only if not AbortError.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setShareFeedback('copied')
      return
    }
    // Legacy fallback
    const ta = document.createElement('textarea')
    ta.value = url
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    setShareFeedback(ok ? 'copied' : 'failed')
  }
  catch {
    setShareFeedback('failed')
  }
  finally {
    shareBusy.value = false
  }
}

function setShareFeedback(state: 'copied' | 'shared' | 'failed') {
  shareFeedback.value = state
  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
  shareFeedbackTimer = setTimeout(() => {
    shareFeedback.value = 'idle'
  }, 2200)
}

onBeforeUnmount(() => {
  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
})

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
