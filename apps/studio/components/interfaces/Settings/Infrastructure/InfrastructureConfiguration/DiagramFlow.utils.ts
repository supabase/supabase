import type { Edge, Node } from '@xyflow/react'

export const NODE_LAYOUT_ANIMATION_MS = 800
export const EDGE_FADE_MS = 250

export type LayoutTransitionStage = 'fade-out' | 'move' | 'fade-in' | 'done'

export type LayoutTransitionTimings = {
  fadeOutMs: number
  moveMs: number
  fadeInMs: number
  moveStartsAt: number
  fadeInStartsAt: number
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
  return {
    fadeOutMs,
    moveMs: nodeMoveMs,
    fadeInMs,
    moveStartsAt: fadeOutMs,
    fadeInStartsAt: fadeOutMs + nodeMoveMs,
    doneAt: fadeOutMs + nodeMoveMs + fadeInMs,
  }
}

const clampElapsedMs = (elapsedMs: number): number =>
  !Number.isFinite(elapsedMs) || elapsedMs < 0 ? 0 : elapsedMs

export const getLayoutTransitionStage = (
  elapsedMs: number,
  timings: LayoutTransitionTimings
): LayoutTransitionStage => {
  const elapsed = clampElapsedMs(elapsedMs)
  if (elapsed < timings.moveStartsAt) return 'fade-out'
  if (elapsed < timings.fadeInStartsAt) return 'move'
  if (elapsed < timings.doneAt) return 'fade-in'
  return 'done'
}

const stageProgress = (elapsedMs: number, startAt: number, durationMs: number): number => {
  if (durationMs <= 0) return 1
  return Math.min(1, Math.max(0, (elapsedMs - startAt) / durationMs))
}

/** Fade outgoing edges, interpolate nodes with no edges, then fade incoming edges in. */
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
}): { nodes: Node[]; edges: Edge[]; stage: LayoutTransitionStage } => {
  const elapsed = clampElapsedMs(elapsedMs)
  const timings = getLayoutTransitionTimings({
    hasOutgoingEdges: fromEdges.length > 0,
    hasIncomingEdges: toEdges.length > 0,
  })
  const stage = getLayoutTransitionStage(elapsed, timings)

  if (stage === 'fade-out') {
    const opacity = 1 - stageProgress(elapsed, 0, timings.fadeOutMs)
    return { nodes: fromNodes, edges: withEdgeOpacity(fromEdges, opacity), stage }
  }

  if (stage === 'move') {
    const t = stageProgress(elapsed, timings.moveStartsAt, timings.moveMs)
    const fromById = new Map(fromNodes.map((node) => [node.id, node]))
    return { nodes: interpolateNodes(fromById, toNodes, t), edges: [], stage }
  }

  if (stage === 'fade-in') {
    const opacity = stageProgress(elapsed, timings.fadeInStartsAt, timings.fadeInMs)
    return { nodes: toNodes, edges: withEdgeOpacity(toEdges, opacity), stage }
  }

  return { nodes: toNodes, edges: toEdges, stage }
}
