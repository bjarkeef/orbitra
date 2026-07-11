/**
 * Pure force-layout helpers for the actor orbit canvas (no Vue / DOM).
 */

import type { OrbitSimLink, OrbitSimNode } from './orbitSimTypes'

/** Radial seed positions before the force loop settles. */
export function seedOrbitLayout(nodes: OrbitSimNode[], links: OrbitSimLink[]): void {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const projects = nodes.filter(n => n.type === 'project')
  const ringR = Math.max(280, 90 + projects.length * 12)
  projects.forEach((n, i) => {
    const angle = (i / Math.max(projects.length, 1)) * Math.PI * 2 - Math.PI / 2
    n.x = Math.cos(angle) * ringR
    n.y = Math.sin(angle) * ringR
  })
  const byProject = new Map<string, OrbitSimNode[]>()
  for (const l of links) {
    if (l.kind === 'cast-in' && l.source.type === 'project') {
      if (!byProject.has(l.source.id)) byProject.set(l.source.id, [])
      byProject.get(l.source.id)!.push(l.target)
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
  const center = nodes.find(n => n.type === 'actor')
  if (center) {
    center.x = 0
    center.y = 0
    center.fx = 0
    center.fy = 0
  }
}

/**
 * One physics tick; mutates node velocities/positions in place.
 * When node count is high, repulsion is sampled to keep main-thread cost bounded.
 */
export function stepOrbitPhysics(
  nodes: OrbitSimNode[],
  links: OrbitSimLink[],
  alpha: number,
): number {
  const nextAlpha = Math.max(0.015, alpha * 0.988)
  const n = nodes.length
  // Full pairwise only for modest graphs; otherwise stride the outer loop.
  const stride = n > 120 ? 2 : n > 80 ? 1 : 1
  const forceScale = n > 100 ? 700 : 900

  for (let i = 0; i < n; i += stride) {
    const a = nodes[i]
    if (!a) continue
    for (let j = i + 1; j < n; j++) {
      const b = nodes[j]
      if (!b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist2 = dx * dx + dy * dy || 0.01
      const dist = Math.sqrt(dist2)
      const force = (forceScale * nextAlpha) / dist2
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
    const weight = l.weight && l.weight > 1 ? Math.min(l.weight, 8) : 1
    const baseTarget = l.kind === 'acted-in' ? 160 : 90
    // Stronger collabs sit slightly closer
    const target = l.kind === 'cast-in' ? baseTarget - weight * 4 : baseTarget
    const diff = dist - target
    const force = diff * 0.02 * nextAlpha
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

  for (const node of nodes) {
    if (node.fx !== undefined) {
      node.x = node.fx
      node.y = node.fy ?? 0
      node.vx = 0
      node.vy = 0
      continue
    }
    node.vx *= 0.85
    node.vy *= 0.85
    node.x += node.vx
    node.y += node.vy
  }

  return nextAlpha
}

/** Build adjacency for 1-hop neighborhood highlighting. */
export function buildAdjacency(links: OrbitSimLink[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set())
    adj.get(a)!.add(b)
  }
  for (const l of links) {
    add(l.source.id, l.target.id)
    add(l.target.id, l.source.id)
  }
  return adj
}

export function neighborhoodOf(
  adj: Map<string, Set<string>>,
  id: string | null | undefined,
): Set<string> {
  const set = new Set<string>()
  if (!id) return set
  set.add(id)
  const neigh = adj.get(id)
  if (neigh) {
    for (const n of neigh) set.add(n)
  }
  return set
}

/** Fit camera scale so all nodes are roughly visible. */
export function fitCameraToNodes(
  nodes: OrbitSimNode[],
  width: number,
  height: number,
  padding = 48,
): { x: number, y: number, k: number } {
  if (!nodes.length || width <= 0 || height <= 0) {
    return { x: 0, y: 0, k: 0.55 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const r = n.r || 8
    minX = Math.min(minX, n.x - r)
    minY = Math.min(minY, n.y - r)
    maxX = Math.max(maxX, n.x + r)
    maxY = Math.max(maxY, n.y + r)
  }
  const bw = Math.max(maxX - minX, 1)
  const bh = Math.max(maxY - minY, 1)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const k = Math.min(
    2.2,
    Math.max(0.22, Math.min((width - padding * 2) / bw, (height - padding * 2) / bh)),
  )
  return {
    x: -cx * k,
    y: -cy * k,
    k,
  }
}

/** Mobile-friendly orbit fetch caps (smaller graphs on narrow viewports). */
export function orbitGraphDefaults(width?: number): {
  maxProjects: number
  topCastPerProject: number
  height: number
} {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024)
  if (w < 480) {
    return { maxProjects: 10, topCastPerProject: 4, height: 440 }
  }
  if (w < 768) {
    return { maxProjects: 14, topCastPerProject: 5, height: 520 }
  }
  return { maxProjects: 24, topCastPerProject: 8, height: 640 }
}

/** TMDB profile/poster URL for canvas (same base as client imageUrl). */
export function tmdbImageUrl(
  filePath: string | null | undefined,
  size: 'w45' | 'w92' | 'w185' | 'w342' = 'w185',
): string {
  if (filePath == null) return ''
  const raw = String(filePath).trim()
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  const file = raw.startsWith('/') ? raw.slice(1) : raw
  if (!file || file.includes('..') || file.includes('//')) return ''
  return `https://image.tmdb.org/t/p/${size}/${file}`
}
