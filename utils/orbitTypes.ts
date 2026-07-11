/**
 * Shared orbit graph types (server API + client canvas).
 */

export type GraphNodeType = 'actor' | 'project' | 'costar' | 'repeat'

export type OrbitMediaFilter = 'all' | 'movie' | 'tv'
export type OrbitRankMode = 'popular' | 'recent' | 'top_rated' | 'hybrid'

export interface GraphNode {
  id: string
  tmdbId: number
  type: GraphNodeType
  label: string
  image?: string | null
  mediaType?: string
  year?: string
  voteCount?: number
  voteAverage?: number
  character?: string
  collabCount?: number
  /** Radius hint for canvas drawing */
  r: number
}

export interface GraphLink {
  sourceId: string
  targetId: string
  kind: string
  /** Shared-title strength for co-star edges (optional). */
  weight?: number
}

export interface GraphSharedTitle {
  id: number
  mediaType: string
  title: string
  year?: string
}

export interface GraphTopCollaborator {
  tmdbId: number
  label: string
  image?: string | null
  collabCount: number
  sharedTitles?: GraphSharedTitle[]
}

export interface GraphInsights {
  totalProjects: number
  totalCostars: number
  repeatCollaborators: number
  topCollaborators: GraphTopCollaborator[]
  yearSpan?: { min: number, max: number } | null
  mediumSplit?: { movie: number, tv: number }
}

export interface GraphPayload {
  personId: number
  personName: string
  nodes: GraphNode[]
  links: GraphLink[]
  truncated: boolean
  projectCount: number
  insights: GraphInsights
  builtAt: string
  meta?: {
    cache?: 'HIT' | 'MISS'
    buildMs?: number
    partial?: boolean
    media?: OrbitMediaFilter
    rank?: OrbitRankMode
    yearFrom?: number | null
    yearTo?: number | null
  }
}

export interface OrbitGraphQuery {
  maxProjects: number
  topCast: number
  media: OrbitMediaFilter
  rank: OrbitRankMode
  yearFrom: number | null
  yearTo: number | null
}
