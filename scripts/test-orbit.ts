/**
 * Lightweight technical checks for orbit pure helpers.
 * Run: npx --yes tsx scripts/test-orbit.ts
 */
import assert from 'node:assert/strict'
import {
  buildAdjacency,
  fitCameraToNodes,
  neighborhoodOf,
  orbitGraphDefaults,
  seedOrbitLayout,
  stepOrbitPhysics,
  tmdbImageUrl,
} from '../utils/orbitSim'
import type { OrbitSimLink, OrbitSimNode } from '../utils/orbitSimTypes'
import {
  orbitQueryFromRouteQuery,
  orbitQueryToApiParams,
  parseOrbitMedia,
  parseOrbitRank,
} from '../utils/orbitQuery'

function makeNode(id: string, type: string): OrbitSimNode {
  return {
    id,
    type,
    label: id,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 10,
  }
}

{
  const center = makeNode('person-1', 'actor')
  const p1 = makeNode('movie-1', 'project')
  const p2 = makeNode('movie-2', 'project')
  const c1 = makeNode('person-2', 'costar')
  const nodes = [center, p1, p2, c1]
  const links: OrbitSimLink[] = [
    { source: center, target: p1, kind: 'acted-in' },
    { source: center, target: p2, kind: 'acted-in' },
    { source: p1, target: c1, kind: 'cast-in' },
  ]
  seedOrbitLayout(nodes, links)
  assert.equal(center.x, 0)
  assert.equal(center.y, 0)
  assert.ok(Math.hypot(p1.x, p1.y) > 100, 'project should be away from center')
  assert.ok(Math.hypot(c1.x - p1.x, c1.y - p1.y) < 120, 'costar near project')
}

{
  const a = makeNode('a', 'project')
  const b = makeNode('b', 'project')
  a.x = 0
  b.x = 50
  const nodes = [a, b]
  const links: OrbitSimLink[] = []
  const next = stepOrbitPhysics(nodes, links, 1)
  assert.ok(next < 1)
  assert.ok(a.x !== 0 || b.x !== 50 || a.vx !== 0, 'repulsion should apply')
}

{
  const a = makeNode('a', 'actor')
  const b = makeNode('b', 'project')
  const c = makeNode('c', 'costar')
  const links: OrbitSimLink[] = [
    { source: a, target: b, kind: 'acted-in' },
    { source: b, target: c, kind: 'cast-in' },
  ]
  const adj = buildAdjacency(links)
  const n = neighborhoodOf(adj, 'b')
  assert.ok(n.has('a') && n.has('b') && n.has('c'))
  assert.equal(neighborhoodOf(adj, null).size, 0)
}

{
  const nodes = [makeNode('a', 'actor'), makeNode('b', 'project')]
  nodes[0].x = -100
  nodes[0].y = -50
  nodes[1].x = 100
  nodes[1].y = 50
  const cam = fitCameraToNodes(nodes, 800, 600)
  assert.ok(cam.k > 0 && cam.k <= 2.2)
}

{
  assert.equal(orbitGraphDefaults(400).maxProjects, 10)
  assert.equal(orbitGraphDefaults(900).maxProjects, 24)
}

{
  assert.equal(tmdbImageUrl('/abc.jpg', 'w185'), 'https://image.tmdb.org/t/p/w185/abc.jpg')
  assert.equal(tmdbImageUrl(null), '')
  assert.equal(tmdbImageUrl('../x'), '')
}

{
  assert.equal(parseOrbitMedia('tv'), 'tv')
  assert.equal(parseOrbitRank('hybrid'), 'hybrid')
  const q = orbitQueryFromRouteQuery(
    { media: 'movie', yearFrom: '2010', rank: 'recent' },
    { maxProjects: 24, topCast: 8 },
  )
  assert.equal(q.media, 'movie')
  assert.equal(q.yearFrom, 2010)
  assert.equal(q.rank, 'recent')
  const params = orbitQueryToApiParams(q)
  assert.equal(params.media, 'movie')
  assert.equal(params.yearFrom, 2010)
}

console.log('orbit pure tests: OK')
