import type { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import {
  easeInOutCubic,
  EDGE_FADE_IN_START,
  EDGE_FADE_MS,
  getLayoutTransitionFrame,
  getLayoutTransitionTimings,
  hasLayoutDelta,
  interpolateNodes,
  lerp,
  NODE_LAYOUT_ANIMATION_MS,
  withEdgeOpacity,
} from './DiagramFlow.utils'

const node = (id: string, x: number, y: number, width = 100, height = 40): Node => ({
  id,
  position: { x, y },
  width,
  height,
  data: {},
})

const edge = (id: string, extra?: Partial<Edge>): Edge => ({
  id,
  source: 'a',
  target: 'b',
  ...extra,
})

describe('easeInOutCubic', () => {
  it('clamps and eases through the midpoint', () => {
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBe(0.5)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(2)).toBe(1)
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25)
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75)
  })
})

describe('lerp', () => {
  it('interpolates and handles a zero-length range', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(4, 4, 0.3)).toBe(4)
  })
})

describe('hasLayoutDelta', () => {
  it('is false when positions and sizes match', () => {
    expect(hasLayoutDelta([node('a', 0, 0)], [node('a', 0, 0)])).toBe(false)
  })

  it('is true when a node moves, resizes, is added, or is removed', () => {
    expect(hasLayoutDelta([node('a', 0, 0)], [node('a', 8, 0)])).toBe(true)
    expect(hasLayoutDelta([node('a', 0, 0, 100)], [node('a', 0, 0, 120)])).toBe(true)
    expect(hasLayoutDelta([node('a', 0, 0)], [node('a', 0, 0), node('b', 1, 1)])).toBe(true)
    expect(hasLayoutDelta([node('a', 0, 0), node('b', 1, 1)], [node('a', 0, 0)])).toBe(true)
  })
})

describe('interpolateNodes', () => {
  it('returns the target list at the end of the animation', () => {
    const to = [node('a', 10, 20)]
    expect(interpolateNodes(new Map([['a', node('a', 0, 0)]]), to, 1)).toBe(to)
  })

  it('keeps target data while interpolating position and size', () => {
    const from = node('a', 0, 0, 100, 40)
    const to: Node = { ...node('a', 10, 20, 200, 80), data: { label: 'promoted' } }
    const [interpolated] = interpolateNodes(new Map([['a', from]]), [to], 0.5)

    expect(interpolated.data).toEqual({ label: 'promoted' })
    expect(interpolated.position.x).toBeGreaterThan(0)
    expect(interpolated.position.x).toBeLessThan(10)
    expect(interpolated.width).toBeGreaterThan(100)
    expect(interpolated.width).toBeLessThan(200)
  })

  it('snaps new nodes to their target', () => {
    const to = [node('b', 5, 5)]
    expect(interpolateNodes(new Map(), to, 0.5)).toEqual(to)
  })
})

describe('withEdgeOpacity', () => {
  it('sets opacity without dropping existing path styles', () => {
    const faded = withEdgeOpacity([edge('replication', { style: { strokeDasharray: '4 6' } })], 0.4)

    expect(faded[0].style).toEqual({ strokeDasharray: '4 6', opacity: 0.4 })
    expect(faded[0].id).toBe('replication')
  })
})

describe('getLayoutTransitionTimings', () => {
  it('overlaps edge fades with the node move', () => {
    expect(getLayoutTransitionTimings({ hasOutgoingEdges: true, hasIncomingEdges: true })).toEqual({
      moveMs: NODE_LAYOUT_ANIMATION_MS,
      fadeOutMs: EDGE_FADE_MS,
      fadeInStartsAt: NODE_LAYOUT_ANIMATION_MS * EDGE_FADE_IN_START,
      fadeInMs: EDGE_FADE_MS,
      doneAt: NODE_LAYOUT_ANIMATION_MS,
    })
  })

  it('includes fade windows only when that side has edges', () => {
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: false, hasIncomingEdges: false })
    ).toMatchObject({ fadeOutMs: 0, fadeInMs: 0, doneAt: NODE_LAYOUT_ANIMATION_MS })
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: true, hasIncomingEdges: false })
    ).toMatchObject({ fadeOutMs: EDGE_FADE_MS, fadeInMs: 0 })
  })

  it('runs past the move when a fade outlasts it', () => {
    expect(
      getLayoutTransitionTimings({
        hasOutgoingEdges: true,
        hasIncomingEdges: true,
        edgeFadeMs: 500,
        nodeMoveMs: 400,
      }).doneAt
    ).toBe(400 * EDGE_FADE_IN_START + 500)
  })
})

describe('getLayoutTransitionFrame', () => {
  const fromNodes = [node('a', 0, 0)]
  const toNodes = [node('a', 100, 0)]
  const kept = edge('kept')
  const fromEdges = [kept, edge('old')]
  const toEdges = [kept, edge('new', { style: { strokeDasharray: '4 6' } })]
  const timings = getLayoutTransitionTimings({
    hasOutgoingEdges: true,
    hasIncomingEdges: true,
  })
  const frameAt = (elapsedMs: number) =>
    getLayoutTransitionFrame({ elapsedMs, fromNodes, toNodes, fromEdges, toEdges })
  const edgeById = (edges: Edge[], id: string) => edges.find((e) => e.id === id)

  it('moves nodes from the first frame', () => {
    expect(frameAt(0).nodes[0].position.x).toBe(0)
    expect(frameAt(NODE_LAYOUT_ANIMATION_MS / 2).nodes[0].position.x).toBe(50)
  })

  it('keeps edges shared by both layouts visible throughout', () => {
    for (const elapsed of [0, EDGE_FADE_MS / 2, timings.fadeInStartsAt, timings.doneAt - 1]) {
      expect(edgeById(frameAt(elapsed).edges, 'kept')).toBe(kept)
    }
  })

  it('fades removed edges out as the move starts', () => {
    expect(edgeById(frameAt(0).edges, 'old')?.style?.opacity).toBe(1)
    expect(edgeById(frameAt(EDGE_FADE_MS / 2).edges, 'old')?.style?.opacity).toBe(0.5)
    expect(edgeById(frameAt(EDGE_FADE_MS).edges, 'old')).toBeUndefined()
  })

  it('resumes an interrupted fade from its current opacity', () => {
    const frame = getLayoutTransitionFrame({
      elapsedMs: EDGE_FADE_MS / 2,
      fromNodes,
      toNodes,
      fromEdges: [edge('old', { style: { opacity: 0.4 } })],
      toEdges: [],
    })
    expect(frame.edges[0].style?.opacity).toBeCloseTo(0.2)
  })

  it('adds new edges only once nodes are near their targets, then fades them in', () => {
    expect(edgeById(frameAt(timings.fadeInStartsAt - 1).edges, 'new')).toBeUndefined()
    expect(edgeById(frameAt(timings.fadeInStartsAt).edges, 'new')).toMatchObject({
      style: { strokeDasharray: '4 6', opacity: 0 },
    })
    expect(
      edgeById(frameAt(timings.fadeInStartsAt + EDGE_FADE_MS / 2).edges, 'new')?.style?.opacity
    ).toBe(0.5)
  })

  it('finishes on the target layout untouched', () => {
    const done = frameAt(timings.doneAt)
    expect(done.isDone).toBe(true)
    expect(done.nodes).toBe(toNodes)
    expect(done.edges).toBe(toEdges)
    expect(frameAt(timings.doneAt - 1).isDone).toBe(false)
  })

  it('treats non-finite elapsed time as the start of the transition', () => {
    const frame = frameAt(Number.NaN)
    expect(frame.isDone).toBe(false)
    expect(frame.nodes[0].position.x).toBe(0)
    expect(edgeById(frame.edges, 'old')?.style?.opacity).toBe(1)
  })
})
