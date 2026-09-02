import { describe, expect, it } from 'vitest'

import type { Edge, Node } from '@xyflow/react'

import {
  easeInOutCubic,
  EDGE_FADE_MS,
  getLayoutTransitionFrame,
  getLayoutTransitionStage,
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
    const faded = withEdgeOpacity([edge('replication', { style: { strokeDasharray: '3 5' } })], 0.4)

    expect(faded[0].style).toEqual({ strokeDasharray: '3 5', opacity: 0.4 })
    expect(faded[0].id).toBe('replication')
  })
})

describe('getLayoutTransitionTimings', () => {
  it('includes fade windows only when that side has edges', () => {
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: true, hasIncomingEdges: true })
    ).toEqual({
      fadeOutMs: EDGE_FADE_MS,
      moveMs: NODE_LAYOUT_ANIMATION_MS,
      fadeInMs: EDGE_FADE_MS,
      moveStartsAt: EDGE_FADE_MS,
      fadeInStartsAt: EDGE_FADE_MS + NODE_LAYOUT_ANIMATION_MS,
      doneAt: EDGE_FADE_MS + NODE_LAYOUT_ANIMATION_MS + EDGE_FADE_MS,
    })
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: false, hasIncomingEdges: false })
    ).toEqual({
      fadeOutMs: 0,
      moveMs: NODE_LAYOUT_ANIMATION_MS,
      fadeInMs: 0,
      moveStartsAt: 0,
      fadeInStartsAt: NODE_LAYOUT_ANIMATION_MS,
      doneAt: NODE_LAYOUT_ANIMATION_MS,
    })
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: true, hasIncomingEdges: false })
    ).toMatchObject({ fadeOutMs: EDGE_FADE_MS, fadeInMs: 0 })
    expect(
      getLayoutTransitionTimings({ hasOutgoingEdges: false, hasIncomingEdges: true })
    ).toMatchObject({ fadeOutMs: 0, fadeInMs: EDGE_FADE_MS })
  })
})

describe('getLayoutTransitionStage', () => {
  const timings = getLayoutTransitionTimings({
    hasOutgoingEdges: true,
    hasIncomingEdges: true,
  })

  it('walks fade-out, move, fade-in, then done', () => {
    expect(getLayoutTransitionStage(0, timings)).toBe('fade-out')
    expect(getLayoutTransitionStage(timings.moveStartsAt - 1, timings)).toBe('fade-out')
    expect(getLayoutTransitionStage(timings.moveStartsAt, timings)).toBe('move')
    expect(getLayoutTransitionStage(timings.fadeInStartsAt - 1, timings)).toBe('move')
    expect(getLayoutTransitionStage(timings.fadeInStartsAt, timings)).toBe('fade-in')
    expect(getLayoutTransitionStage(timings.doneAt - 1, timings)).toBe('fade-in')
    expect(getLayoutTransitionStage(timings.doneAt, timings)).toBe('done')
    expect(getLayoutTransitionStage(timings.doneAt + 5_000, timings)).toBe('done')
  })

  it('treats non-finite and negative elapsed time as the start', () => {
    expect(getLayoutTransitionStage(Number.NaN, timings)).toBe('fade-out')
    expect(getLayoutTransitionStage(Number.NEGATIVE_INFINITY, timings)).toBe('fade-out')
    expect(getLayoutTransitionStage(-20, timings)).toBe('fade-out')
  })

  it('starts on move when there are no outgoing edges', () => {
    const moveFirst = getLayoutTransitionTimings({
      hasOutgoingEdges: false,
      hasIncomingEdges: true,
    })
    expect(getLayoutTransitionStage(0, moveFirst)).toBe('move')
  })
})

describe('getLayoutTransitionFrame', () => {
  const fromNodes = [node('a', 0, 0)]
  const toNodes = [node('a', 100, 0)]
  const fromEdges = [edge('old')]
  const toEdges = [edge('new', { style: { strokeDasharray: '3 5' } })]
  const timings = getLayoutTransitionTimings({
    hasOutgoingEdges: true,
    hasIncomingEdges: true,
  })

  it('fades outgoing edges while nodes stay put', () => {
    const start = getLayoutTransitionFrame({
      elapsedMs: 0,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })
    const mid = getLayoutTransitionFrame({
      elapsedMs: EDGE_FADE_MS / 2,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })

    expect(start.stage).toBe('fade-out')
    expect(start.nodes).toBe(fromNodes)
    expect(start.edges[0].style?.opacity).toBe(1)
    expect(mid.nodes[0].position).toEqual({ x: 0, y: 0 })
    expect(mid.edges[0].style?.opacity).toBe(0.5)
    expect(mid.edges[0].id).toBe('old')
  })

  it('clears edges while nodes interpolate', () => {
    const startMove = getLayoutTransitionFrame({
      elapsedMs: timings.moveStartsAt,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })
    const midMove = getLayoutTransitionFrame({
      elapsedMs: timings.moveStartsAt + NODE_LAYOUT_ANIMATION_MS / 2,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })

    expect(startMove.stage).toBe('move')
    expect(startMove.edges).toEqual([])
    expect(startMove.nodes[0].position.x).toBe(0)
    expect(midMove.edges).toEqual([])
    expect(midMove.nodes[0].position.x).toBe(50)
  })

  it('fades incoming edges in after nodes arrive', () => {
    const startFadeIn = getLayoutTransitionFrame({
      elapsedMs: timings.fadeInStartsAt,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })
    const midFadeIn = getLayoutTransitionFrame({
      elapsedMs: timings.fadeInStartsAt + EDGE_FADE_MS / 2,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })
    const done = getLayoutTransitionFrame({
      elapsedMs: timings.doneAt,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })

    expect(startFadeIn.stage).toBe('fade-in')
    expect(startFadeIn.nodes).toBe(toNodes)
    expect(startFadeIn.edges[0]).toMatchObject({
      id: 'new',
      style: { strokeDasharray: '3 5', opacity: 0 },
    })
    expect(midFadeIn.edges[0].style?.opacity).toBe(0.5)
    expect(done.stage).toBe('done')
    expect(done.nodes).toBe(toNodes)
    expect(done.edges).toBe(toEdges)
  })

  it('skips a fade when that side has no edges', () => {
    const noOutgoing = getLayoutTransitionFrame({
      elapsedMs: 0,
      fromNodes,
      toNodes,
      fromEdges: [],
      toEdges,
    })
    const afterMove = getLayoutTransitionFrame({
      elapsedMs: NODE_LAYOUT_ANIMATION_MS,
      fromNodes,
      toNodes,
      fromEdges: [],
      toEdges: [],
    })

    expect(noOutgoing.stage).toBe('move')
    expect(noOutgoing.edges).toEqual([])
    expect(afterMove.stage).toBe('done')
    expect(afterMove.edges).toEqual([])
  })

  it('treats non-finite elapsed time as the start of the transition', () => {
    const frame = getLayoutTransitionFrame({
      elapsedMs: Number.NaN,
      fromNodes,
      toNodes,
      fromEdges,
      toEdges,
    })
    expect(frame.stage).toBe('fade-out')
    expect(frame.edges[0].style?.opacity).toBe(1)
  })
})
