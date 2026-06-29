<template>
  <div class="actor-graph relative w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-700/60">
    <canvas
      ref="canvas"
      class="block w-full select-none"
      :class="cursorClass"
      :style="{ height: height + 'px' }"
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

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10 px-4 text-center">
      <p class="text-sm text-rose-300">{{ error }}</p>
    </div>

    <div class="absolute top-3 right-3 flex flex-col gap-2 z-10">
      <button type="button" class="ctrl-btn" title="Zoom in" @click="zoomBy(1.25)">+</button>
      <button type="button" class="ctrl-btn" title="Zoom out" @click="zoomBy(0.8)">−</button>
      <button type="button" class="ctrl-btn" title="Reset view" @click="resetView">⟲</button>
      <button
        type="button"
        class="ctrl-btn text-xs"
        :class="{ 'ring-2 ring-indigo-400': paused }"
        title="Pause / resume simulation"
        @click="paused = !paused"
      >{{ paused ? '▶' : '❚❚' }}</button>
    </div>

    <div class="absolute bottom-3 left-3 text-xs text-slate-400 space-y-1 z-10 pointer-events-none select-none">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Actor (center)
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Movie / TV
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Co-star
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-rose-400 inline-block" /> Repeat collaborator
      </div>
      <p class="text-slate-600 pt-1">Scroll to zoom · drag to pan · click a node</p>
    </div>

    <div
      v-if="!loading && !error && statsReady"
      class="absolute top-3 left-3 text-xs text-slate-400 bg-slate-900/80 rounded px-2 py-1 z-10 pointer-events-none"
    >
      {{ nodeCount }} nodes · {{ linkCount }} edges
      <span v-if="truncated" class="text-amber-500"> · truncated</span>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
/**
 * Canvas force-directed orbit — render-only.
 * Graph topology comes from GET /api/actors/:id/graph (server-built).
 * Simulation state lives on this._sim outside Vue reactivity.
 */
export default {
  name: 'ActorGraph',
  props: {
    personId: { type: [Number, String], required: true },
    height: { type: Number, default: 620 },
    maxProjects: { type: Number, default: 24 },
    topCastPerProject: { type: Number, default: 8 },
  },
  emits: ['select', 'built', 'insights'],
  data() {
    return {
      loading: true,
      error: null,
      statusText: 'Requesting orbit…',
      statsReady: false,
      nodeCount: 0,
      linkCount: 0,
      truncated: false,
      paused: false,
      selectedId: null,
      hoverId: null,
      cursorClass: 'cursor-grab',
      didDrag: false,
    }
  },
  watch: {
    personId: {
      immediate: true,
      handler() {
        this.loadGraph()
      },
    },
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    this.teardownSim()
    window.removeEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    this.teardownSim()
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    async loadGraph() {
      this.teardownSim()
      this.loading = true
      this.error = null
      this.statsReady = false
      this.statusText = 'Building orbit on server…'
      try {
        const graph = await $fetch(`/api/actors/${this.personId}/graph`, {
          query: {
            maxProjects: this.maxProjects,
            topCast: this.topCastPerProject,
          },
        })
        this.truncated = !!graph.truncated
        this.$emit('insights', graph.insights || null)
        this.$emit('built', graph)
        this.bootSimulation(graph)
      }
      catch (e) {
        this.error = e?.statusMessage || e?.message || 'Could not build orbit'
        this.loading = false
      }
    },

    teardownSim() {
      if (this._sim?.raf) cancelAnimationFrame(this._sim.raf)
      this._sim = null
    },

    bootSimulation(graph) {
      const canvas = this.$refs.canvas
      if (!canvas) {
        this.$nextTick(() => this.bootSimulation(graph))
        return
      }

      const nodes = (graph.nodes || []).map(n => ({
        ...n,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx: n.type === 'actor' ? 0 : undefined,
        fy: n.type === 'actor' ? 0 : undefined,
      }))
      const nodeMap = new Map(nodes.map(n => [n.id, n]))
      const links = []
      for (const l of graph.links || []) {
        const source = nodeMap.get(l.sourceId)
        const target = nodeMap.get(l.targetId)
        if (source && target) links.push({ source, target, kind: l.kind })
      }

      // Radial seed layout
      const projects = nodes.filter(n => n.type === 'project')
      const ringR = Math.max(280, 90 + projects.length * 12)
      projects.forEach((n, i) => {
        const angle = (i / Math.max(projects.length, 1)) * Math.PI * 2 - Math.PI / 2
        n.x = Math.cos(angle) * ringR
        n.y = Math.sin(angle) * ringR
      })
      const byProject = new Map()
      for (const l of links) {
        if (l.kind === 'cast-in' && l.source.type === 'project') {
          if (!byProject.has(l.source.id)) byProject.set(l.source.id, [])
          byProject.get(l.source.id).push(l.target)
        }
      }
      for (const [pid, members] of byProject) {
        const p = nodeMap.get(pid)
        if (!p) continue
        members.forEach((m, i) => {
          if (m.type === 'actor') return
          const a = (i / Math.max(members.length, 1)) * Math.PI * 2
          m.x = p.x + Math.cos(a) * 70
          m.y = p.y + Math.sin(a) * 70
        })
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const sim = {
        nodes,
        links,
        nodeMap,
        camera: { x: 0, y: 0, k: 0.55 },
        drag: null,
        pan: null,
        raf: 0,
        dpr,
        w: 0,
        h: 0,
        alpha: 1,
      }
      this._sim = sim
      this.nodeCount = nodes.length
      this.linkCount = links.length
      this.statsReady = true
      this.loading = false
      this.resizeCanvas()
      this.loop()
    },

    resizeCanvas() {
      const canvas = this.$refs.canvas
      const sim = this._sim
      if (!canvas || !sim) return
      const rect = canvas.getBoundingClientRect()
      sim.w = rect.width
      sim.h = this.height
      canvas.width = Math.floor(sim.w * sim.dpr)
      canvas.height = Math.floor(sim.h * sim.dpr)
      const ctx = canvas.getContext('2d')
      ctx.setTransform(sim.dpr, 0, 0, sim.dpr, 0, 0)
    },

    onResize() {
      this.resizeCanvas()
    },

    loop() {
      const sim = this._sim
      if (!sim) return
      if (!this.paused) this.stepPhysics(sim)
      this.draw(sim)
      sim.raf = requestAnimationFrame(() => this.loop())
    },

    stepPhysics(sim) {
      const { nodes, links } = sim
      const alpha = (sim.alpha = Math.max(0.02, sim.alpha * 0.99))

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist2 = dx * dx + dy * dy || 0.01
          const dist = Math.sqrt(dist2)
          const force = (900 * alpha) / dist2
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          if (a.fx === undefined) {
            a.vx -= fx
            a.vy -= fy
          }
          if (b.fx === undefined) {
            b.vx += fx
            b.vy += fy
          }
        }
      }

      for (const l of links) {
        const a = l.source
        const b = l.target
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const target = l.kind === 'acted-in' ? 160 : 90
        const diff = dist - target
        const force = diff * 0.02 * alpha
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        if (a.fx === undefined) {
          a.vx += fx
          a.vy += fy
        }
        if (b.fx === undefined) {
          b.vx -= fx
          b.vy -= fy
        }
      }

      for (const n of nodes) {
        if (n.fx !== undefined) {
          n.x = n.fx
          n.y = n.fy
          n.vx = 0
          n.vy = 0
          continue
        }
        n.vx *= 0.85
        n.vy *= 0.85
        n.x += n.vx
        n.y += n.vy
      }
    },

    draw(sim) {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const { w, h, camera, nodes, links } = sim
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2 + camera.x, h / 2 + camera.y)
      ctx.scale(camera.k, camera.k)

      for (const l of links) {
        ctx.beginPath()
        ctx.moveTo(l.source.x, l.source.y)
        ctx.lineTo(l.target.x, l.target.y)
        ctx.strokeStyle
          = l.kind === 'acted-in' ? 'rgba(129,140,248,0.35)' : 'rgba(148,163,184,0.2)'
        ctx.lineWidth = l.kind === 'acted-in' ? 1.4 : 1
        ctx.stroke()
      }

      for (const n of nodes) {
        const selected = n.id === this.selectedId
        const hover = n.id === this.hoverId
        let fill = '#34d399'
        if (n.type === 'actor') fill = '#6366f1'
        else if (n.type === 'project') fill = '#f59e0b'
        else if (n.type === 'repeat') fill = '#fb7185'

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r || 8, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.globalAlpha = selected || hover ? 1 : 0.92
        ctx.fill()
        if (selected || hover) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2 / camera.k
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        if ((n.type === 'actor' || n.type === 'project' || selected || hover) && camera.k > 0.35) {
          ctx.fillStyle = '#e2e8f0'
          ctx.font = `${11 / camera.k}px system-ui,sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(n.label, n.x, n.y + (n.r || 8) + 12 / camera.k)
        }
      }

      ctx.restore()
    },

    screenToWorld(clientX, clientY) {
      const sim = this._sim
      const canvas = this.$refs.canvas
      if (!sim || !canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const sx = clientX - rect.left
      const sy = clientY - rect.top
      const { camera, w, h } = sim
      return {
        x: (sx - w / 2 - camera.x) / camera.k,
        y: (sy - h / 2 - camera.y) / camera.k,
      }
    },

    hitTest(wx, wy) {
      const sim = this._sim
      if (!sim) return null
      let best = null
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
    },

    onPointerDown(e) {
      const sim = this._sim
      if (!sim) return
      this.didDrag = false
      const world = this.screenToWorld(e.clientX, e.clientY)
      const hit = this.hitTest(world.x, world.y)
      if (hit && hit.type !== 'actor') {
        sim.drag = {
          id: hit.id,
          ox: world.x - hit.x,
          oy: world.y - hit.y,
        }
        hit.fx = hit.x
        hit.fy = hit.y
      }
      else {
        sim.pan = { x: e.clientX, y: e.clientY, cx: sim.camera.x, cy: sim.camera.y }
      }
      this.cursorClass = 'cursor-grabbing'
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },

    onPointerMove(e) {
      const sim = this._sim
      if (!sim) return
      const world = this.screenToWorld(e.clientX, e.clientY)
      if (sim.drag) {
        this.didDrag = true
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
        if (Math.abs(dx) + Math.abs(dy) > 3) this.didDrag = true
        sim.camera.x = sim.pan.cx + dx
        sim.camera.y = sim.pan.cy + dy
        return
      }
      const hit = this.hitTest(world.x, world.y)
      this.hoverId = hit?.id || null
      this.cursorClass = hit ? 'cursor-pointer' : 'cursor-grab'
    },

    onPointerUp(e) {
      const sim = this._sim
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
      this.cursorClass = 'cursor-grab'
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId)
      }
      catch {
        /* ignore */
      }
    },

    onClick() {
      if (this.didDrag) return
      const sim = this._sim
      if (!sim) return
      // use last hover if click without move — recompute via hoverId
      const id = this.hoverId
      const n = id ? sim.nodeMap.get(id) : null
      this.selectedId = n?.id || null
      this.$emit('select', n || null)
    },

    onWheel(e) {
      const sim = this._sim
      if (!sim) return
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      sim.camera.k = Math.min(2.5, Math.max(0.2, sim.camera.k * factor))
    },

    zoomBy(factor) {
      const sim = this._sim
      if (!sim) return
      sim.camera.k = Math.min(2.5, Math.max(0.2, sim.camera.k * factor))
    },

    resetView() {
      const sim = this._sim
      if (!sim) return
      sim.camera = { x: 0, y: 0, k: 0.55 }
      sim.alpha = 1
    },
  },
}
</script>

<style scoped>
.ctrl-btn {
  @apply w-8 h-8 rounded-md bg-slate-900/90 border border-slate-600 text-slate-200 hover:bg-slate-800;
}
.cursor-grab {
  cursor: grab;
}
.cursor-grabbing {
  cursor: grabbing;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
