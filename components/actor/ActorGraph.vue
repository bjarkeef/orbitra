<template>
  <div class="actor-graph relative w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-700/60">
    <!-- Canvas -->
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

    <!-- Loading / progress -->
    <div
      v-if="building"
      class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10"
    >
      <div class="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          class="h-full bg-indigo-500 transition-all duration-300 rounded-full"
          :style="{ width: buildProgress + '%' }"
        />
      </div>
      <p class="text-sm text-slate-300">{{ buildStatus }}</p>
      <p class="text-xs text-slate-500 mt-1">
        Fetching casts (rate-limited to respect TMDB)
      </p>
    </div>

    <!-- Controls -->
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

    <!-- Legend -->
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

    <!-- Stats bar -->
    <div
      v-if="!building && statsReady"
      class="absolute top-3 left-3 text-xs text-slate-400 bg-slate-900/80 rounded px-2 py-1 z-10 pointer-events-none"
    >
      {{ nodeCount }} nodes · {{ linkCount }} edges
      <span v-if="truncated" class="text-amber-500"> · truncated</span>
    </div>
  </div>
</template>

<script>
/**
 * Canvas force-directed actor graph.
 *
 * Simulation state (nodes/links/camera) lives OUTSIDE Vue reactivity on `this._sim`
 * so rAF mutations don't get proxied and we never trip NaN from reactive edge cases.
 */
export default {
  name: 'ActorGraph',
  props: {
    person: { type: Object, required: true },
    credits: { type: Array, default: () => [] },
    height: { type: Number, default: 620 },
    maxProjects: { type: Number, default: 30 },
    topCastPerProject: { type: Number, default: 8 },
  },
  emits: ['select', 'built', 'insights'],
  data() {
    return {
      building: true,
      buildProgress: 0,
      buildStatus: 'Starting…',
      statsReady: false,
      nodeCount: 0,
      linkCount: 0,
      truncated: false,
      paused: false,
      selectedId: null,
      hoverId: null,
      cursorClass: 'cursor-grab',
      // Track drag distance so click doesn't fire after a pan
      didDrag: false,
    };
  },
  created() {
    // Non-reactive simulation bag — never assign these through `this.*` for perf/correctness
    this._sim = {
      nodes: [],
      links: [],
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      dpr: 1,
      raf: null,
      running: false,
      // simulation energy (decays → graph settles)
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.022,
      alphaTarget: 0,
      // pointer state
      mode: null, // 'pan' | 'node' | null
      dragNode: null,
      lastX: 0,
      lastY: 0,
      pointerId: null,
    };
  },
  async mounted() {
    this._sim.dpr = window.devicePixelRatio || 1;
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);
    await this.buildGraph();
    this.startSim();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCanvas);
    this._sim.running = false;
    if (this._sim.raf) cancelAnimationFrame(this._sim.raf);
  },
  methods: {
    // ─── Graph construction ───────────────────────────────────────────
    async buildGraph() {
      this.building = true;
      this.buildProgress = 2;
      this.buildStatus = 'Deduplicating filmography…';

      const actorId = this.person.id;
      const actorName = this.person.name;

      const seen = new Set();
      let projects = (this.credits || [])
        .filter((c) => {
          const key = `${c.media_type || 'movie'}-${c.id}`;
          if (!c.id || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

      if (projects.length > this.maxProjects) {
        this.truncated = true;
        projects = projects.slice(0, this.maxProjects);
      }

      const nodes = [];
      const links = [];
      const nodeMap = new Map();
      const collabCount = new Map();

      const addNode = (n) => {
        if (!nodeMap.has(n.id)) {
          // Always initialize physics fields — missing x/y caused NaN cascade
          n.x = n.x ?? 0;
          n.y = n.y ?? 0;
          n.vx = n.vx ?? 0;
          n.vy = n.vy ?? 0;
          nodeMap.set(n.id, n);
          nodes.push(n);
        }
        return nodeMap.get(n.id);
      };

      addNode({
        id: `person-${actorId}`,
        tmdbId: actorId,
        type: 'actor',
        label: actorName,
        image: this.person.profile_path,
        r: 28,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
      });

      this.buildProgress = 8;
      this.buildStatus = `Fetching casts for ${projects.length} projects…`;

      const batchSize = 5;

      for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (proj) => {
            const mediaType = proj.media_type || 'movie';
            const pNode = addNode({
              id: `${mediaType}-${proj.id}`,
              tmdbId: proj.id,
              type: 'project',
              mediaType,
              label: proj.title || proj.name || 'Untitled',
              image: proj.poster_path,
              year: (proj.release_date || proj.first_air_date || '').slice(0, 4),
              voteCount: proj.vote_count || 0,
              voteAverage: proj.vote_average || 0,
              character: proj.character || '',
              r: 14 + Math.min(10, Math.log10((proj.vote_count || 1) + 1) * 4),
            });

            links.push({
              sourceId: `person-${actorId}`,
              targetId: pNode.id,
              kind: 'acted-in',
            });

            try {
              const { getCreditsForTitle } = useTmdb();
              const data = await getCreditsForTitle(mediaType === 'tv' ? 'tv' : 'movie', proj.id);
              const cast = (data.cast || []).slice(0, this.topCastPerProject);

              for (const member of cast) {
                if (member.id === actorId) continue;
                const cId = `person-${member.id}`;
                addNode({
                  id: cId,
                  tmdbId: member.id,
                  type: 'costar',
                  label: member.name,
                  image: member.profile_path,
                  r: 9,
                });
                links.push({
                  sourceId: pNode.id,
                  targetId: cId,
                  kind: 'cast-in',
                });
                collabCount.set(member.id, (collabCount.get(member.id) || 0) + 1);
              }
            } catch {
              /* skip failed project */
            }
          })
        );

        this.buildProgress = 8 + Math.round(((i + batch.length) / projects.length) * 85);
        this.buildStatus = `Fetched ${Math.min(i + batch.length, projects.length)} / ${projects.length} projects…`;
        if (i + batchSize < projects.length) {
          await new Promise((r) => setTimeout(r, 220));
        }
      }

      for (const [cid, count] of collabCount) {
        if (count >= 2) {
          const n = nodeMap.get(`person-${cid}`);
          if (n) {
            n.type = 'repeat';
            n.collabCount = count;
            n.r = 9 + Math.min(8, count);
          }
        }
      }

      // Resolve links to live node refs
      const resolvedLinks = [];
      for (const l of links) {
        const source = nodeMap.get(l.sourceId);
        const target = nodeMap.get(l.targetId);
        if (source && target) {
          resolvedLinks.push({ source, target, kind: l.kind });
        }
      }

      // Stable radial layout: projects on an inner ring, co-stars further out near their projects
      const projects_n = nodes.filter((n) => n.type === 'project');
      const ringR = Math.max(280, 90 + projects_n.length * 12);
      projects_n.forEach((n, i) => {
        const angle = (i / Math.max(projects_n.length, 1)) * Math.PI * 2 - Math.PI / 2;
        n.x = Math.cos(angle) * ringR;
        n.y = Math.sin(angle) * ringR;
        n.vx = 0;
        n.vy = 0;
      });

      // Place each co-star near the average angle of projects they're linked to
      const costarLinks = new Map(); // nodeId -> project node refs
      for (const l of resolvedLinks) {
        if (l.kind !== 'cast-in') continue;
        const costar = l.target;
        const proj = l.source;
        if (!costarLinks.has(costar.id)) costarLinks.set(costar.id, []);
        costarLinks.get(costar.id).push(proj);
      }
      let costarIdx = 0;
      for (const n of nodes) {
        if (n.type === 'actor' || n.type === 'project') continue;
        const projs = costarLinks.get(n.id) || [];
        let angle = Math.random() * Math.PI * 2;
        if (projs.length) {
          let sx = 0;
          let sy = 0;
          for (const p of projs) {
            sx += p.x;
            sy += p.y;
          }
          angle = Math.atan2(sy / projs.length, sx / projs.length);
        }
        // Fan co-stars outward with per-node stagger so they don't pile on the same ray
        const dist = ringR + 160 + (costarIdx % 6) * 28 + (projs.length > 1 ? 30 : 50);
        const jitter = (Math.random() - 0.5) * 0.55 + ((costarIdx % 5) - 2) * 0.08;
        n.x = Math.cos(angle + jitter) * dist;
        n.y = Math.sin(angle + jitter) * dist;
        n.vx = 0;
        n.vy = 0;
        costarIdx++;
      }

      // Stash on non-reactive sim bag
      this._sim.nodes = nodes;
      this._sim.links = resolvedLinks;
      this._sim.scale = 1;
      this._sim.offsetX = 0;
      this._sim.offsetY = 0;
      // Fresh energy so it gently settles from the seeded layout (not chaotic)
      // Slightly longer settle so the extra spacing forces can finish their work
      this._sim.alpha = 0.7;
      this._sim.alphaTarget = 0;
      this._sim.alphaDecay = 0.018;

      this.nodeCount = nodes.length;
      this.linkCount = resolvedLinks.length;
      this.statsReady = true;

      const insights = this.computeInsights(nodes, resolvedLinks, collabCount);
      this.$emit('insights', insights);
      this.$emit('built', {
        nodes: nodes.length,
        links: resolvedLinks.length,
        truncated: this.truncated,
      });

      this.buildProgress = 100;
      this.buildStatus = 'Done';
      this.building = false;

      this.$nextTick(() => {
        this.resizeCanvas();
        this.fitToView();
      });
    },

    computeInsights(nodes, links, collabCount) {
      const costars = nodes.filter((n) => n.type === 'costar' || n.type === 'repeat');
      const projects_n = nodes.filter((n) => n.type === 'project');
      const repeats = nodes.filter((n) => n.type === 'repeat');
      const actorDegree = projects_n.length;

      const projDegrees = projects_n.map((p) =>
        links.filter((l) => l.source === p || l.target === p).length
      );
      const avgProjDegree =
        projDegrees.length > 0
          ? projDegrees.reduce((a, b) => a + b, 0) / projDegrees.length
          : 0;

      const repeatRatio = costars.length > 0 ? repeats.length / costars.length : 0;

      const topCollabs = [...collabCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const n = nodes.find((x) => x.tmdbId === id && x.type !== 'actor');
          return n ? { name: n.label, count, id } : null;
        })
        .filter(Boolean);

      let shape = 'mixed';
      let shapeNote = '';
      if (actorDegree <= 8 && repeatRatio < 0.08) {
        shape = 'journeyman';
        shapeNote =
          'Sparse graph, few repeat collaborators — a career of one-offs and varied ensembles. Looks like scattered islands around the actor.';
      } else if (repeatRatio >= 0.18 || (topCollabs[0] && topCollabs[0].count >= 4)) {
        shape = 'franchise-anchor';
        shapeNote =
          'Dense rose cluster(s) of repeat collaborators — franchise or repertory company energy. The graph clumps; you can see the ensemble orbit.';
      } else if (actorDegree >= 20 && repeatRatio < 0.12) {
        shape = 'prolific-wanderer';
        shapeNote =
          'Many project nodes, low repeat rate — high volume across different casts. The ring is wide and airy rather than clumped.';
      } else if (avgProjDegree >= 7 && actorDegree >= 10) {
        shape = 'ensemble-player';
        shapeNote =
          'Projects connect to large casts consistently — the graph fans out with thick spokes rather than tight loops.';
      } else {
        shapeNote =
          'A balanced mix of one-offs and returning collaborators. Look for rose nodes as the signature relationships.';
      }

      const votes = projects_n.map((p) => p.voteCount || 0);
      const maxVotes = Math.max(...votes, 1);
      const bigHits = projects_n.filter((p) => (p.voteCount || 0) > maxVotes * 0.5).length;

      return {
        actorDegree,
        costarCount: costars.length,
        projectCount: projects_n.length,
        repeatCount: repeats.length,
        repeatRatio,
        avgProjDegree: Math.round(avgProjDegree * 10) / 10,
        topCollabs,
        shape,
        shapeNote,
        bigHits,
        truncated: this.truncated,
        perfNote: this.perfNote(nodes.length),
      };
    },

    perfNote(n) {
      if (n < 150) return 'Comfortable at 60fps on most machines.';
      if (n < 400) return 'Still smooth; occasional frame dips if you drag aggressively.';
      if (n < 800) return 'Getting heavy — we throttle alpha and simplify drawing at this scale.';
      return 'Past the sweet spot. Truncate projects further or switch to WebGL for comfortable interaction.';
    },

    // ─── Force simulation (d3-style alpha cooling — settles, doesn't thrash) ──
    startSim() {
      if (this._sim.running) return;
      this._sim.running = true;
      const tick = () => {
        if (!this._sim.running) return;
        if (!this.paused) this.simStep();
        this.draw();
        this._sim.raf = requestAnimationFrame(tick);
      };
      this._sim.raf = requestAnimationFrame(tick);
    },

    /** Reheat slightly when user interacts so graph can re-settle */
    reheat(amount = 0.12) {
      this._sim.alpha = Math.min(0.35, Math.max(this._sim.alpha, amount));
    },

    simStep() {
      const sim = this._sim;
      const nodes = sim.nodes;
      const links = sim.links;
      if (!nodes.length) return;

      // Cool toward target (usually 0) — once alpha is tiny, graph is essentially frozen
      sim.alpha += (sim.alphaTarget - sim.alpha) * sim.alphaDecay;
      if (sim.alpha < sim.alphaMin && sim.alphaTarget === 0) {
        // Still apply pins / zero velocity so nothing drifts
        for (const n of nodes) {
          if (n.fx != null && n.fy != null) {
            n.x = n.fx;
            n.y = n.fy;
          }
          n.vx = 0;
          n.vy = 0;
        }
        return;
      }

      const alpha = sim.alpha;
      const N = nodes.length;

      // Gentle, scale-aware forces — tuned for breathing room without chaos
      const linkStrength = 0.28;
      const chargeStrength = N > 400 ? -72 : N > 200 ? -95 : -120;
      const gravity = 0.006; // weaker gravity lets the cloud expand
      const velocityDecay = 0.58;
      const maxSpeed = 7;

      // Link springs (distance constraints) — longer = more space between connected nodes
      for (const l of links) {
        const s = l.source;
        const t = l.target;
        let dx = t.x - s.x;
        let dy = t.y - s.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (!isFinite(dist) || dist < 1e-6) dist = 1e-6;
        const targetDist = l.kind === 'acted-in' ? 220 : 110;
        const bias = ((dist - targetDist) / dist) * linkStrength * alpha;
        dx *= bias;
        dy *= bias;
        const sw = s.fx == null ? 1 : 0;
        const tw = t.fx == null ? 1 : 0;
        const w = sw + tw || 1;
        if (sw) {
          s.vx += (dx * tw) / w;
          s.vy += (dy * tw) / w;
        }
        if (tw) {
          t.vx -= (dx * sw) / w;
          t.vy -= (dy * sw) / w;
        }
      }

      // Charge (repulsion) — pushes unconnected neighbors apart
      const step = N > 350 ? 2 : 1;
      const charge = chargeStrength * alpha;
      for (let i = 0; i < N; i += step) {
        const a = nodes[i];
        for (let j = i + step; j < N; j += step) {
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (!isFinite(dist2)) continue;
          // Floor stops explosion; higher floor = more push when close
          if (dist2 < 400) dist2 = 400;
          // Act at longer range so clusters don't stay glued
          if (dist2 > 280000) continue;
          const dist = Math.sqrt(dist2);
          const f = charge / dist2;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          if (a.fx == null) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (b.fx == null) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Integrate velocities with gravity + damping + speed clamp
      for (const n of nodes) {
        if (n.fx != null && n.fy != null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          continue;
        }

        n.vx -= n.x * gravity * alpha;
        n.vy -= n.y * gravity * alpha;

        n.vx *= velocityDecay;
        n.vy *= velocityDecay;

        if (!isFinite(n.vx)) n.vx = 0;
        if (!isFinite(n.vy)) n.vy = 0;

        const sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (sp > maxSpeed) {
          n.vx = (n.vx / sp) * maxSpeed;
          n.vy = (n.vy / sp) * maxSpeed;
        }

        n.x += n.vx;
        n.y += n.vy;
        if (!isFinite(n.x)) n.x = 0;
        if (!isFinite(n.y)) n.y = 0;
      }
    },

    // ─── Rendering ────────────────────────────────────────────────────
    resizeCanvas() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = Math.max(parent?.clientWidth || canvas.getBoundingClientRect().width || 800, 1);
      const h = this.height;
      const dpr = this._sim.dpr || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    canvasSize() {
      const canvas = this.$refs.canvas;
      if (!canvas) return { w: 800, h: this.height };
      const dpr = this._sim.dpr || 1;
      return {
        w: canvas.width / dpr || 800,
        h: canvas.height / dpr || this.height,
      };
    },

    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { w, h } = this.canvasSize();
      const sim = this._sim;
      const nodes = sim.nodes;
      const links = sim.links;

      // Reset transform each frame so resizeCanvas + draw stay in sync
      const dpr = sim.dpr || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      if (!nodes.length) return;

      const scale = isFinite(sim.scale) && sim.scale > 0 ? sim.scale : 1;
      const ox = isFinite(sim.offsetX) ? sim.offsetX : 0;
      const oy = isFinite(sim.offsetY) ? sim.offsetY : 0;

      ctx.save();
      ctx.translate(w / 2 + ox, h / 2 + oy);
      ctx.scale(scale, scale);

      const simplify = nodes.length > 450;

      for (const l of links) {
        const s = l.source;
        const t = l.target;
        if (!isFinite(s.x) || !isFinite(s.y) || !isFinite(t.x) || !isFinite(t.y)) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        if (l.kind === 'acted-in') {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.55)';
          ctx.lineWidth = 1.6 / scale;
        } else {
          ctx.strokeStyle = simplify
            ? 'rgba(100, 116, 139, 0.35)'
            : 'rgba(100, 116, 139, 0.55)';
          ctx.lineWidth = 1 / scale;
        }
        ctx.stroke();
      }

      // Draw back-to-front: costars → repeats → projects → actor
      const rank = { costar: 0, repeat: 1, project: 2, actor: 3 };
      const order = nodes.slice().sort((a, b) => (rank[a.type] || 0) - (rank[b.type] || 0));

      for (const n of order) {
        if (!isFinite(n.x) || !isFinite(n.y)) continue;
        const isHover = n.id === this.hoverId;
        const isSel = n.id === this.selectedId;
        const r = (n.r || 8) + (isHover || isSel ? 3 : 0);

        if (n.type === 'actor' || isSel) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
          ctx.fillStyle =
            n.type === 'actor' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.12)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        if (n.type === 'actor') ctx.fillStyle = '#6366f1';
        else if (n.type === 'project') ctx.fillStyle = '#f59e0b';
        else if (n.type === 'repeat') ctx.fillStyle = '#fb7185';
        else ctx.fillStyle = '#10b981';
        ctx.fill();

        if (isHover || isSel) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        }

        const showLabel =
          n.type === 'actor' ||
          n.type === 'project' ||
          n.type === 'repeat' ||
          isHover ||
          isSel;
        if (showLabel && scale > 0.35) {
          const fontSize = Math.max(
            10,
            Math.min(14, (n.type === 'actor' ? 15 : 11) / Math.sqrt(scale))
          );
          ctx.font = `${n.type === 'actor' ? '600' : '400'} ${fontSize}px Nunito, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const label =
            n.type === 'project' && n.year
              ? `${n.label} (${n.year})`
              : n.type === 'repeat'
                ? `${n.label} ×${n.collabCount}`
                : n.label;
          ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
          ctx.fillText(label, n.x + 1, n.y + r + 5);
          ctx.fillStyle = n.type === 'actor' ? '#e0e7ff' : '#cbd5e1';
          ctx.fillText(label, n.x, n.y + r + 4);
        }
      }

      ctx.restore();
    },

    // ─── Camera ───────────────────────────────────────────────────────
    zoomBy(factor, cx, cy) {
      const { w, h } = this.canvasSize();
      const sim = this._sim;
      const mx = cx ?? w / 2;
      const my = cy ?? h / 2;
      const scale = isFinite(sim.scale) && sim.scale > 0 ? sim.scale : 1;
      const ox = isFinite(sim.offsetX) ? sim.offsetX : 0;
      const oy = isFinite(sim.offsetY) ? sim.offsetY : 0;
      const wx = (mx - w / 2 - ox) / scale;
      const wy = (my - h / 2 - oy) / scale;
      sim.scale = Math.min(4, Math.max(0.12, scale * factor));
      sim.offsetX = mx - w / 2 - wx * sim.scale;
      sim.offsetY = my - h / 2 - wy * sim.scale;
    },

    resetView() {
      this._sim.scale = 1;
      this._sim.offsetX = 0;
      this._sim.offsetY = 0;
      this.fitToView();
    },

    fitToView() {
      const nodes = this._sim.nodes;
      if (!nodes.length) return;
      const { w, h } = this.canvasSize();

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let any = false;
      for (const n of nodes) {
        if (!isFinite(n.x) || !isFinite(n.y)) continue;
        any = true;
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      }
      if (!any) {
        this._sim.scale = 1;
        this._sim.offsetX = 0;
        this._sim.offsetY = 0;
        return;
      }

      const gw = Math.max(maxX - minX, 80);
      const gh = Math.max(maxY - minY, 80);
      const pad = 80;
      // Allow more zoom-out so the expanded layout fits in view
      const s = Math.min((w - pad) / gw, (h - pad) / gh, 1);
      this._sim.scale = Math.max(0.1, s * 0.82);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      this._sim.offsetX = -cx * this._sim.scale;
      this._sim.offsetY = -cy * this._sim.scale;
    },

    // ─── Pointer / hit-test ───────────────────────────────────────────
    screenToWorld(clientX, clientY) {
      const canvas = this.$refs.canvas;
      const rect = canvas.getBoundingClientRect();
      const { w, h } = this.canvasSize();
      const sim = this._sim;
      const scale = isFinite(sim.scale) && sim.scale > 0 ? sim.scale : 1;
      const ox = isFinite(sim.offsetX) ? sim.offsetX : 0;
      const oy = isFinite(sim.offsetY) ? sim.offsetY : 0;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        x: (x - w / 2 - ox) / scale,
        y: (y - h / 2 - oy) / scale,
      };
    },

    hitTest(clientX, clientY) {
      const { x, y } = this.screenToWorld(clientX, clientY);
      const nodes = this._sim.nodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!isFinite(n.x) || !isFinite(n.y)) continue;
        const dx = n.x - x;
        const dy = n.y - y;
        const hitR = (n.r || 8) + 6;
        if (dx * dx + dy * dy <= hitR * hitR) return n;
      }
      return null;
    },

    onPointerDown(e) {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      this.didDrag = false;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      this._sim.pointerId = e.pointerId;
      this._sim.lastX = e.clientX;
      this._sim.lastY = e.clientY;

      const node = this.hitTest(e.clientX, e.clientY);
      // Remember hit target; don't pin/drag until pointer actually moves (avoids reheat on click)
      if (node && node.type !== 'actor') {
        this._sim.mode = 'pending-node';
        this._sim.dragNode = node;
        this.cursorClass = 'cursor-pointer';
      } else {
        this._sim.mode = 'pending-pan';
        this._sim.dragNode = null;
        this.cursorClass = 'cursor-grabbing';
      }
    },

    onPointerMove(e) {
      const sim = this._sim;
      // Hover when not actively dragging
      if (!sim.mode) {
        const node = this.hitTest(e.clientX, e.clientY);
        this.hoverId = node ? node.id : null;
        this.cursorClass = node ? 'cursor-pointer' : 'cursor-grab';
        return;
      }

      const dx = e.clientX - sim.lastX;
      const dy = e.clientY - sim.lastY;
      const moved = Math.abs(dx) > 3 || Math.abs(dy) > 3;

      // Promote pending gestures only after a real move threshold
      if (moved && sim.mode === 'pending-node' && sim.dragNode) {
        sim.mode = 'node';
        sim.dragNode.fx = sim.dragNode.x;
        sim.dragNode.fy = sim.dragNode.y;
        this.didDrag = true;
        this.cursorClass = 'cursor-grabbing';
      } else if (moved && sim.mode === 'pending-pan') {
        sim.mode = 'pan';
        this.didDrag = true;
      } else if (moved && (sim.mode === 'node' || sim.mode === 'pan')) {
        this.didDrag = true;
      }

      if (sim.mode === 'node' && sim.dragNode) {
        const world = this.screenToWorld(e.clientX, e.clientY);
        sim.dragNode.fx = world.x;
        sim.dragNode.fy = world.y;
        sim.dragNode.x = world.x;
        sim.dragNode.y = world.y;
        this.reheat(0.08);
      } else if (sim.mode === 'pan') {
        sim.offsetX += dx;
        sim.offsetY += dy;
      }

      sim.lastX = e.clientX;
      sim.lastY = e.clientY;
    },

    onPointerUp(e) {
      const sim = this._sim;
      const wasRealDrag = this.didDrag && sim.mode === 'node';
      if (sim.dragNode && sim.dragNode.type !== 'actor') {
        // Only unpin if we actually pinned during a drag
        if (sim.dragNode.fx != null || sim.dragNode.fy != null) {
          sim.dragNode.fx = null;
          sim.dragNode.fy = null;
        }
        // Reheat only after a real node drag — NOT on simple clicks (that was expanding the graph)
        if (wasRealDrag) this.reheat(0.15);
      }
      sim.dragNode = null;
      sim.mode = null;
      sim.pointerId = null;
      this.cursorClass = 'cursor-grab';
      try {
        if (e?.pointerId != null) this.$refs.canvas?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },

    onClick(e) {
      if (this.didDrag) {
        this.didDrag = false;
        return;
      }
      // Selection only — never touch scale/offset/alpha here
      const node = this.hitTest(e.clientX, e.clientY);
      if (node) {
        this.selectedId = node.id;
        this.$emit('select', { ...node });
      } else {
        this.selectedId = null;
        this.$emit('select', null);
      }
    },

    onWheel(e) {
      const canvas = this.$refs.canvas;
      const rect = canvas.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
    },
  },
};
</script>

<style scoped>
.ctrl-btn {
  @apply w-9 h-9 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-lg font-bold
    flex items-center justify-center shadow border border-slate-600/50 transition;
}
</style>
