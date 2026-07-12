<template>
  <div class="actor-graph relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60">
    <canvas
      ref="canvas"
      class="block w-full select-none"
      :class="cursorClass"
      :style="{ height: height + 'px' }"
      role="img"
      :aria-label="ariaLabel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
      @wheel.prevent="onWheel"
      @click="onClick"
    />

    <div
      v-if="loading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10"
    >
      <div class="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div class="h-full bg-indigo-500 animate-pulse rounded-full w-2/3" />
      </div>
      <p class="text-sm text-slate-300">{{ statusText }}</p>
      <p class="text-xs text-slate-500 mt-1">Building orbit on the server…</p>
    </div>

    <div
      v-else-if="error"
      class="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10 px-4 text-center"
    >
      <div>
        <p class="text-sm text-rose-300 mb-3">{{ error }}</p>
        <button type="button" class="btn-secondary" @click="loadGraph">Retry</button>
      </div>
    </div>

    <div class="absolute top-3 right-3 flex flex-col gap-2 z-10">
      <button type="button" class="ctrl-btn" title="Zoom in" @click="zoomBy(1.25)">+</button>
      <button type="button" class="ctrl-btn" title="Zoom out" @click="zoomBy(0.8)">−</button>
      <button type="button" class="ctrl-btn" title="Fit graph" @click="fitView">⊡</button>
      <button type="button" class="ctrl-btn" title="Reset view" @click="resetView">⟲</button>
      <button
        type="button"
        class="ctrl-btn text-xs"
        :class="{ 'ring-2 ring-indigo-400': animate }"
        :title="animate ? 'Turn off physics motion' : 'Turn on physics motion'"
        :aria-pressed="animate"
        @click="toggleAnimate"
      >{{ animate ? '❚❚' : '▶' }}</button>
    </div>

    <div class="absolute bottom-3 left-3 text-xs text-slate-400 space-y-1 z-10 pointer-events-none select-none max-w-[12rem] sm:max-w-none">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Center
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Title
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Co-star
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-rose-400 inline-block" /> Repeat collab
      </div>
      <p class="text-slate-600 pt-1">Scroll · drag · click a node</p>
    </div>

    <div
      v-if="!loading && !error && statsReady"
      class="absolute top-3 left-3 text-xs text-slate-400 bg-slate-900/85 rounded-lg px-2.5 py-1.5 z-10 pointer-events-none ring-1 ring-slate-700/60"
    >
      {{ nodeCount }} nodes · {{ linkCount }} edges
      <span v-if="truncated" class="text-amber-500"> · truncated</span>
      <span v-if="cacheLabel" class="text-slate-600"> · {{ cacheLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Canvas force-directed orbit — render-only.
 * Topology: GET /api/actors/:id/graph. Physics: utils/orbitSim.
 */
import {
  buildAdjacency,
  fitCameraToNodes,
  neighborhoodOf,
  seedOrbitLayout,
  stepOrbitPhysics,
  tmdbImageUrl,
} from '~/utils/orbitSim'
import type { OrbitSimLink, OrbitSimNode } from '~/utils/orbitSimTypes'
import type { GraphPayload, OrbitGraphQuery } from '~/utils/orbitTypes'
import { orbitQueryToApiParams } from '~/utils/orbitQuery'

const props = withDefaults(defineProps<{
  personId: number | string
  height?: number
  maxProjects?: number
  topCastPerProject?: number
  media?: 'all' | 'movie' | 'tv'
  rank?: 'popular' | 'recent' | 'top_rated' | 'hybrid'
  yearFrom?: number | null
  yearTo?: number | null
  selectedId?: string | null
  /**
   * When true, the force simulation keeps ticking (living graph).
   * Default off — static settled layout; user can opt in via the ▶ control.
   */
  animate?: boolean
}>(), {
  height: 620,
  maxProjects: 24,
  topCastPerProject: 8,
  media: 'all',
  rank: 'popular',
  yearFrom: null,
  yearTo: null,
  selectedId: null,
  animate: false,
})

const emit = defineEmits<{
  'select': [node: OrbitSimNode | null]
  'built': [graph: GraphPayload]
  'insights': [insights: GraphPayload['insights'] | null]
  'update:animate': [value: boolean]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const statusText = ref('Requesting orbit…')
const statsReady = ref(false)
const nodeCount = ref(0)
const linkCount = ref(0)
const truncated = ref(false)
const cacheLabel = ref('')
const selectedIdLocal = ref<string | null>(null)
const hoverId = ref<string | null>(null)
const cursorClass = ref('cursor-grab')
const didDrag = ref(false)

const ariaLabel = computed(() =>
  `Co-star orbit graph${nodeCount.value ? ` with ${nodeCount.value} nodes` : ''}`,
)

interface SimState {
  nodes: OrbitSimNode[]
  links: OrbitSimLink[]
  nodeMap: Map<string, OrbitSimNode>
  adj: Map<string, Set<string>>
  camera: { x: number, y: number, k: number }
  drag: { id: string, ox: number, oy: number } | null
  pan: { x: number, y: number, cx: number, cy: number } | null
  raf: number
  dpr: number
  w: number
  h: number
  alpha: number
  images: Map<string, HTMLImageElement | 'loading' | 'error'>
  reducedMotion: boolean
}

let sim: SimState | null = null
let visible = true
/** Monotonic token so stale graph responses never boot after a newer load. */
let loadToken = 0

const effectiveSelected = computed(() => props.selectedId ?? selectedIdLocal.value)

watch(
  () => [
    props.personId,
    props.maxProjects,
    props.topCastPerProject,
    props.media,
    props.rank,
    props.yearFrom,
    props.yearTo,
  ],
  () => { loadGraph() },
  { immediate: true },
)

watch(
  () => props.selectedId,
  (id) => {
    if (id !== undefined) selectedIdLocal.value = id
  },
)

function onVisibility() {
  visible = typeof document === 'undefined' || document.visibilityState === 'visible'
}

function onResize() {
  resizeCanvas()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()
})

onBeforeUnmount(() => {
  teardownSim()
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
})

async function loadGraph() {
  const token = ++loadToken
  teardownSim()
  loading.value = true
  error.value = null
  statsReady.value = false
  statusText.value = 'Building orbit on server…'
  cacheLabel.value = ''
  try {
    const query: OrbitGraphQuery = {
      maxProjects: props.maxProjects,
      topCast: props.topCastPerProject,
      media: props.media,
      rank: props.rank,
      yearFrom: props.yearFrom,
      yearTo: props.yearTo,
    }
    const graph = await $fetch<GraphPayload>(`/api/actors/${props.personId}/graph`, {
      query: orbitQueryToApiParams(query),
      timeout: 90_000,
    })
    if (token !== loadToken) return
    truncated.value = !!graph.truncated
    cacheLabel.value = graph.meta?.cache === 'HIT'
      ? 'cached'
      : graph.meta?.buildMs
        ? `${graph.meta.buildMs}ms`
        : ''
    emit('insights', graph.insights || null)
    emit('built', graph)
    bootSimulation(graph)
  }
  catch (e: unknown) {
    if (token !== loadToken) return
    const err = e as { statusMessage?: string, message?: string }
    error.value = err?.statusMessage || err?.message || 'Could not build orbit'
    loading.value = false
  }
}

function teardownSim() {
  if (sim?.raf) cancelAnimationFrame(sim.raf)
  sim = null
}

function preloadImage(path: string | null | undefined, images: SimState['images']) {
  if (!path || images.has(path)) return
  images.set(path, 'loading')
  if (typeof Image === 'undefined') {
    images.set(path, 'error')
    return
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    images.set(path, img)
  }
  img.onerror = () => {
    images.set(path, 'error')
  }
  img.src = tmdbImageUrl(path, 'w185')
}

function bootSimulation(graph: GraphPayload) {
  const el = canvas.value
  if (!el) {
    nextTick(() => bootSimulation(graph))
    return
  }

  const nodes: OrbitSimNode[] = (graph.nodes || []).map(n => ({
    ...n,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fx: n.type === 'actor' ? 0 : undefined,
    fy: n.type === 'actor' ? 0 : undefined,
  }))
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const links: OrbitSimLink[] = []
  for (const l of graph.links || []) {
    const source = nodeMap.get(l.sourceId)
    const target = nodeMap.get(l.targetId)
    if (source && target) {
      links.push({ source, target, kind: l.kind, weight: l.weight })
    }
  }

  seedOrbitLayout(nodes, links)
  const images = new Map<string, HTMLImageElement | 'loading' | 'error'>()
  for (const n of nodes) preloadImage(n.image, images)

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  sim = {
    nodes,
    links,
    nodeMap,
    adj: buildAdjacency(links),
    camera: { x: 0, y: 0, k: 0.55 },
    drag: null,
    pan: null,
    raf: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    w: 0,
    h: 0,
    alpha: reducedMotion ? 0.02 : 1,
    images,
    reducedMotion,
  }
  nodeCount.value = nodes.length
  linkCount.value = links.length
  statsReady.value = true
  loading.value = false
  resizeCanvas()
  // Pre-settle a few steps so first paint is less chaotic
  if (!reducedMotion) {
    for (let i = 0; i < 40; i++) {
      sim.alpha = stepOrbitPhysics(sim.nodes, sim.links, sim.alpha)
    }
  }
  fitView()
  loop()
}

function resizeCanvas() {
  const el = canvas.value
  if (!el || !sim) return
  const rect = el.getBoundingClientRect()
  sim.w = rect.width
  sim.h = props.height
  el.width = Math.floor(sim.w * sim.dpr)
  el.height = Math.floor(sim.h * sim.dpr)
  const ctx = el.getContext('2d')
  if (ctx) ctx.setTransform(sim.dpr, 0, 0, sim.dpr, 0, 0)
}

function toggleAnimate() {
  emit('update:animate', !props.animate)
}

// Re-energize the sim when the user opts into motion after a settled layout.
watch(
  () => props.animate,
  (on) => {
    if (on && sim && !sim.reducedMotion && sim.alpha < 0.15) {
      sim.alpha = 0.6
    }
  },
)

function loop() {
  if (!sim) return
  // Motion is opt-in: only step physics when animate is on and a11y allows it.
  if (visible && props.animate && !sim.reducedMotion) {
    sim.alpha = stepOrbitPhysics(sim.nodes, sim.links, sim.alpha)
  }
  draw(sim)
  sim.raf = requestAnimationFrame(loop)
}

/**
 * Draw an image into a circle with object-fit: cover (crop, never stretch).
 * `align: 'top'` keeps faces in frame for portrait profiles.
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  align: 'center' | 'top' = 'center',
) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const size = r * 2
  const scale = Math.max(size / iw, size / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = cx - dw / 2
  // Top-align when the scaled image is taller than the disc (typical portraits).
  const dy = align === 'top' && dh > size + 0.5
    ? cy - r
    : cy - dh / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

function draw(state: SimState) {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  const { w, h, camera, nodes, links, adj } = state
  ctx.clearRect(0, 0, w, h)

  // subtle radial backdrop
  const grd = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.55)
  grd.addColorStop(0, 'rgba(49,46,129,0.18)')
  grd.addColorStop(1, 'rgba(2,6,23,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2 + camera.x, h / 2 + camera.y)
  ctx.scale(camera.k, camera.k)

  const focus = effectiveSelected.value || hoverId.value
  const neigh = neighborhoodOf(adj, focus)
  const dimming = !!focus

  for (const l of links) {
    const inN = !dimming || (neigh.has(l.source.id) && neigh.has(l.target.id))
    const weight = l.weight && l.weight > 1 ? Math.min(l.weight, 8) : 1
    ctx.beginPath()
    ctx.moveTo(l.source.x, l.source.y)
    ctx.lineTo(l.target.x, l.target.y)
    if (l.kind === 'acted-in') {
      ctx.strokeStyle = inN ? 'rgba(129,140,248,0.55)' : 'rgba(129,140,248,0.08)'
      ctx.lineWidth = 1.6
    }
    else {
      const alpha = inN ? 0.18 + weight * 0.06 : 0.04
      ctx.strokeStyle = l.source.type === 'repeat' || l.target.type === 'repeat'
        ? `rgba(251,113,133,${alpha + 0.1})`
        : `rgba(148,163,184,${alpha})`
      ctx.lineWidth = 0.9 + weight * 0.15
    }
    ctx.stroke()
  }

  for (const n of nodes) {
    const selected = n.id === effectiveSelected.value
    const hover = n.id === hoverId.value
    const inN = !dimming || neigh.has(n.id)
    const r = n.r || 8

    let fill = '#34d399'
    if (n.type === 'actor') fill = '#6366f1'
    else if (n.type === 'project') fill = '#f59e0b'
    else if (n.type === 'repeat') fill = '#fb7185'

    ctx.globalAlpha = inN ? (selected || hover ? 1 : 0.95) : 0.18

    // glow for selected / repeat
    if ((selected || hover || n.type === 'repeat') && inN) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
      ctx.fillStyle = n.type === 'repeat' ? 'rgba(251,113,133,0.25)' : 'rgba(255,255,255,0.12)'
      ctx.fill()
    }

    // image disc when available — object-fit: cover (crop, never stretch)
    const imgEntry = n.image ? state.images.get(n.image) : null
    if (imgEntry && imgEntry instanceof HTMLImageElement) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      const faceAlign = n.type === 'project' ? 'center' : 'top'
      drawImageCover(ctx, imgEntry, n.x, n.y, r, faceAlign)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.strokeStyle = fill
      ctx.lineWidth = selected || hover ? 3 / camera.k : 2 / camera.k
      ctx.stroke()
    }
    else {
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      if (selected || hover) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / camera.k
        ctx.stroke()
      }
    }

    if ((n.type === 'actor' || n.type === 'project' || selected || hover) && camera.k > 0.32 && inN) {
      ctx.fillStyle = '#e2e8f0'
      ctx.font = `${11 / camera.k}px system-ui,sans-serif`
      ctx.textAlign = 'center'
      const label = n.label.length > 28 ? n.label.slice(0, 26) + '…' : n.label
      ctx.fillText(label, n.x, n.y + r + 12 / camera.k)
      if (n.type === 'repeat' && n.collabCount && (selected || hover || camera.k > 0.7)) {
        ctx.fillStyle = '#fda4af'
        ctx.font = `${10 / camera.k}px system-ui,sans-serif`
        ctx.fillText(`×${n.collabCount}`, n.x, n.y + r + 24 / camera.k)
      }
    }
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function screenToWorld(clientX: number, clientY: number) {
  if (!sim || !canvas.value) return { x: 0, y: 0 }
  const rect = canvas.value.getBoundingClientRect()
  const sx = clientX - rect.left
  const sy = clientY - rect.top
  const { camera, w, h } = sim
  return {
    x: (sx - w / 2 - camera.x) / camera.k,
    y: (sy - h / 2 - camera.y) / camera.k,
  }
}

function hitTest(wx: number, wy: number) {
  if (!sim) return null
  let best: OrbitSimNode | null = null
  let bestD = Infinity
  for (const n of sim.nodes) {
    const dx = n.x - wx
    const dy = n.y - wy
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d <= (n.r || 8) + 4 && d < bestD) {
      best = n
      bestD = d
    }
  }
  return best
}

function onPointerDown(e: PointerEvent) {
  if (!sim) return
  didDrag.value = false
  const world = screenToWorld(e.clientX, e.clientY)
  const hit = hitTest(world.x, world.y)
  if (hit && hit.type !== 'actor') {
    sim.drag = { id: hit.id, ox: world.x - hit.x, oy: world.y - hit.y }
    hit.fx = hit.x
    hit.fy = hit.y
  }
  else {
    sim.pan = { x: e.clientX, y: e.clientY, cx: sim.camera.x, cy: sim.camera.y }
  }
  cursorClass.value = 'cursor-grabbing'
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!sim) return
  const world = screenToWorld(e.clientX, e.clientY)
  if (sim.drag) {
    didDrag.value = true
    const n = sim.nodeMap.get(sim.drag.id)
    if (n) {
      n.fx = world.x - sim.drag.ox
      n.fy = world.y - sim.drag.oy
      n.x = n.fx
      n.y = n.fy
    }
    return
  }
  if (sim.pan) {
    const dx = e.clientX - sim.pan.x
    const dy = e.clientY - sim.pan.y
    if (Math.abs(dx) + Math.abs(dy) > 3) didDrag.value = true
    sim.camera.x = sim.pan.cx + dx
    sim.camera.y = sim.pan.cy + dy
    return
  }
  const hit = hitTest(world.x, world.y)
  hoverId.value = hit?.id || null
  cursorClass.value = hit ? 'cursor-pointer' : 'cursor-grab'
}

function onPointerUp(e: PointerEvent) {
  if (!sim) return
  if (sim.drag) {
    const n = sim.nodeMap.get(sim.drag.id)
    if (n && n.type !== 'actor') {
      n.fx = undefined
      n.fy = undefined
    }
  }
  sim.drag = null
  sim.pan = null
  cursorClass.value = 'cursor-grab'
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }
  catch { /* ignore */ }
}

function onClick() {
  if (didDrag.value) return
  if (!sim) return
  const id = hoverId.value
  const n = id ? sim.nodeMap.get(id) || null : null
  selectedIdLocal.value = n?.id || null
  emit('select', n)
}

function onWheel(e: WheelEvent) {
  if (!sim) return
  const factor = e.deltaY > 0 ? 0.9 : 1.1
  const world = screenToWorld(e.clientX, e.clientY)
  const prevK = sim.camera.k
  const nextK = Math.min(2.5, Math.max(0.2, prevK * factor))
  // zoom toward cursor
  sim.camera.x = world.x * prevK + sim.camera.x - world.x * nextK
  sim.camera.y = world.y * prevK + sim.camera.y - world.y * nextK
  sim.camera.k = nextK
}

function zoomBy(factor: number) {
  if (!sim) return
  sim.camera.k = Math.min(2.5, Math.max(0.2, sim.camera.k * factor))
}

function resetView() {
  if (!sim) return
  sim.camera = { x: 0, y: 0, k: 0.55 }
  sim.alpha = 1
}

function fitView() {
  if (!sim) return
  sim.camera = fitCameraToNodes(sim.nodes, sim.w || 800, sim.h || props.height)
}

defineExpose({ loadGraph, fitView, resetView })
</script>

<style scoped>
.ctrl-btn {
  @apply w-8 h-8 rounded-md bg-slate-900/90 border border-slate-600 text-slate-200 hover:bg-slate-800;
}
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }
.cursor-pointer { cursor: pointer; }
</style>
