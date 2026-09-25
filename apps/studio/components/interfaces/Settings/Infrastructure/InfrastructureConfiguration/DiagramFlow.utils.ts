import type { Edge, Node } from '@xyflow/react'

export const NODE_LAYOUT_ANIMATION_MS = 600
export const EDGE_FADE_MS = 200
/**
 * How far through the node move incoming edges start fading in. Edges route
 * between live node positions, so holding new ones back until nodes are near
 * their targets skips the awkward mid-move routing.
 */
export const EDGE_FADE_IN_START = 0.5

export type LayoutTransitionTimings = {
  moveMs: number
  fadeOutMs: number
  fadeInStartsAt: number
  fadeInMs: number
  doneAt: number
}

export const easeInOutCubic = (t: number): number => {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t

export const hasNodeLayoutDelta = (
  from: Pick<Node, 'position' | 'width' | 'height'> | undefined,
  to: Pick<Node, 'position' | 'width' | 'height'>
): boolean => {
  if (from === undefined) return true
  return (
    from.position.x !== to.position.x ||
    from.position.y !== to.position.y ||
    (from.width ?? 0) !== (to.width ?? 0) ||
    (from.height ?? 0) !== (to.height ?? 0)
  )
}

export const hasLayoutDelta = (from: Node[], to: Node[]): boolean => {
  if (from.length !== to.length) return true
  const fromById = new Map(from.map((node) => [node.id, node]))
  return to.some((node) => hasNodeLayoutDelta(fromById.get(node.id), node))
}

/** Interpolates position and size from `fromById` onto the target node list. */
export const interpolateNodes = (fromById: Map<string, Node>, to: Node[], t: number): Node[] => {
  const progress = easeInOutCubic(t)
  if (progress >= 1) return to

  return to.map((node) => {
    const from = fromById.get(node.id)
    if (from === undefined) return node

    return {
      ...node,
      position: {
        x: lerp(from.position.x, node.position.x, progress),
        y: lerp(from.position.y, node.position.y, progress),
      },
      width:
        node.width !== undefined && from.width !== undefined
          ? lerp(from.width, node.width, progress)
          : node.width,
      height:
        node.height !== undefined && from.height !== undefined
          ? lerp(from.height, node.height, progress)
          : node.height,
    }
  })
}

export const withEdgeOpacity = (edges: Edge[], opacity: number): Edge[] =>
  edges.map((edge) => ({
    ...edge,
    style: { ...edge.style, opacity },
  }))

/** Current opacity of an edge, so an interrupted fade resumes instead of jumping back to 1. */
const getEdgeOpacity = (edge: Edge): number =>
  typeof edge.style?.opacity === 'number' ? edge.style.opacity : 1

export const getLayoutTransitionTimings = ({
  hasOutgoingEdges,
  hasIncomingEdges,
  edgeFadeMs = EDGE_FADE_MS,
  nodeMoveMs = NODE_LAYOUT_ANIMATION_MS,
}: {
  hasOutgoingEdges: boolean
  hasIncomingEdges: boolean
  edgeFadeMs?: number
  nodeMoveMs?: number
}): LayoutTransitionTimings => {
  const fadeOutMs = hasOutgoingEdges ? edgeFadeMs : 0
  const fadeInMs = hasIncomingEdges ? edgeFadeMs : 0
  const fadeInStartsAt = nodeMoveMs * EDGE_FADE_IN_START
  return {
    moveMs: nodeMoveMs,
    fadeOutMs,
    fadeInStartsAt,
    fadeInMs,
    doneAt: Math.max(nodeMoveMs, fadeOutMs, fadeInStartsAt + fadeInMs),
  }
}

const clampElapsedMs = (elapsedMs: number): number =>
  !Number.isFinite(elapsedMs) || elapsedMs < 0 ? 0 : elapsedMs

const stageProgress = (elapsedMs: number, startAt: number, durationMs: number): number => {
  if (durationMs <= 0) return 1
  return Math.min(1, Math.max(0, (elapsedMs - startAt) / durationMs))
}

/**
 * One frame of a layout change. Nodes interpolate to their new positions while
 * edges stay attached: edges in both layouts follow the nodes, removed edges
 * fade out as the move starts, and added edges fade in once nodes are close to
 * their targets. Edges are added to the list only when their fade starts, so
 * an edge's mount animation (e.g. a draw-in) lines up with its appearance.
 */
export const getLayoutTransitionFrame = ({
  elapsedMs,
  fromNodes,
  toNodes,
  fromEdges,
  toEdges,
}: {
  elapsedMs: number
  fromNodes: Node[]
  toNodes: Node[]
  fromEdges: Edge[]
  toEdges: Edge[]
}): { nodes: Node[]; edges: Edge[]; isDone: boolean } => {
  const elapsed = clampElapsedMs(elapsedMs)
  const fromEdgeIds = new Set(fromEdges.map((edge) => edge.id))
  const toEdgeIds = new Set(toEdges.map((edge) => edge.id))
  const outgoingEdges = fromEdges.filter((edge) => !toEdgeIds.has(edge.id))
  const retainedEdges = toEdges.filter((edge) => fromEdgeIds.has(edge.id))
  const incomingEdges = toEdges.filter((edge) => !fromEdgeIds.has(edge.id))
  const timings = getLayoutTransitionTimings({
    hasOutgoingEdges: outgoingEdges.length > 0,
    hasIncomingEdges: incomingEdges.length > 0,
  })

  if (elapsed >= timings.doneAt) return { nodes: toNodes, edges: toEdges, isDone: true }

  const fromById = new Map(fromNodes.map((node) => [node.id, node]))
  const nodes = interpolateNodes(fromById, toNodes, stageProgress(elapsed, 0, timings.moveMs))

  const fadeOutProgress = stageProgress(elapsed, 0, timings.fadeOutMs)
  const fadingOutEdges =
    fadeOutProgress < 1
      ? outgoingEdges.map((edge) => ({
          ...edge,
          style: { ...edge.style, opacity: getEdgeOpacity(edge) * (1 - fadeOutProgress) },
        }))
      : []

  const fadingInEdges =
    elapsed >= timings.fadeInStartsAt
      ? withEdgeOpacity(
          incomingEdges,
          stageProgress(elapsed, timings.fadeInStartsAt, timings.fadeInMs)
        )
      : []

  return { nodes, edges: [...retainedEdges, ...fadingInEdges, ...fadingOutEdges], isDone: false }
}
