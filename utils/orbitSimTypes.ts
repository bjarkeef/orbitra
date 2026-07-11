import type { GraphNodeType } from './orbitTypes'

/** Simulation node (layout state layered on graph node fields). */
export interface OrbitSimNode {
  id: string
  type: GraphNodeType | string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  fx?: number
  fy?: number
  r?: number
  image?: string | null
  mediaType?: string
  year?: string
  character?: string
  collabCount?: number
  tmdbId?: number
  voteCount?: number
  voteAverage?: number
  [key: string]: unknown
}

export interface OrbitSimLink {
  source: OrbitSimNode
  target: OrbitSimNode
  kind: string
  weight?: number
}
