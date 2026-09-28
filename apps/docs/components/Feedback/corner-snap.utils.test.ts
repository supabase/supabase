import { describe, expect, it } from 'vitest'

import {
  getAdjacentPlacement,
  getNearestPlacement,
  parseStoredCorner,
  type DockArrowKey,
  type DockPlacement,
} from './corner-snap.utils'

const VIEWPORT = { width: 1200, height: 800 }
const AT_REST = { x: 0, y: 0 }
const AT_REST_ARGS = { velocity: AT_REST, viewport: VIEWPORT, canCenter: false }

describe('getNearestPlacement', () => {
  it('returns the quadrant of the release point when velocity is zero', () => {
    expect(getNearestPlacement({ ...AT_REST_ARGS, point: { x: 1000, y: 700 } })).toBe(
      'bottom-right'
    )
    expect(getNearestPlacement({ ...AT_REST_ARGS, point: { x: 100, y: 100 } })).toBe('top-left')
    expect(getNearestPlacement({ ...AT_REST_ARGS, point: { x: 1000, y: 100 } })).toBe('top-right')
    expect(getNearestPlacement({ ...AT_REST_ARGS, point: { x: 100, y: 700 } })).toBe('bottom-left')
  })

  it('projects a strong leftward fling into the left half', () => {
    expect(
      getNearestPlacement({
        point: { x: 1000, y: 700 },
        velocity: { x: -2000, y: 0 },
        viewport: VIEWPORT,
        canCenter: false,
      })
    ).toBe('bottom-left')
  })

  it('projects an upward fling into the top half', () => {
    expect(
      getNearestPlacement({
        point: { x: 1000, y: 700 },
        velocity: { x: 0, y: -1000 },
        viewport: VIEWPORT,
        canCenter: false,
      })
    ).toBe('top-right')
  })

  it('snaps to the island only in the bottom middle band, and only when allowed', () => {
    const centerArgs = { ...AT_REST_ARGS, canCenter: true }
    expect(getNearestPlacement({ ...centerArgs, point: { x: 600, y: 700 } })).toBe('center')
    expect(getNearestPlacement({ ...centerArgs, point: { x: 600, y: 100 } })).toBe('top-right')
    expect(getNearestPlacement({ ...centerArgs, point: { x: 300, y: 700 } })).toBe('bottom-left')
    expect(getNearestPlacement({ ...AT_REST_ARGS, point: { x: 600, y: 700 } })).toBe('bottom-right')
  })

  it('ignores a slow drift that does not cross the midpoint', () => {
    expect(
      getNearestPlacement({
        point: { x: 1000, y: 700 },
        velocity: { x: -100, y: 0 },
        viewport: VIEWPORT,
        canCenter: false,
      })
    ).toBe('bottom-right')
  })
})

describe('parseStoredCorner', () => {
  it('returns a valid stored corner', () => {
    expect(parseStoredCorner('top-left')).toBe('top-left')
  })

  it.each([['middle'], [null], [undefined], [42], [''], [{ corner: 'top-left' }]])(
    'falls back to bottom-right for %j',
    (value) => {
      expect(parseStoredCorner(value)).toBe('bottom-right')
    }
  )
})

describe('getAdjacentPlacement', () => {
  const move = (placement: DockPlacement, key: DockArrowKey, canCenter = false) =>
    getAdjacentPlacement({ placement, key, canCenter })

  it('moves horizontally and vertically', () => {
    expect(move('bottom-right', 'ArrowLeft')).toBe('bottom-left')
    expect(move('bottom-left', 'ArrowUp')).toBe('top-left')
    expect(move('top-left', 'ArrowRight')).toBe('top-right')
    expect(move('top-right', 'ArrowDown')).toBe('bottom-right')
  })

  it('stays in place at the edge', () => {
    expect(move('bottom-right', 'ArrowRight')).toBe('bottom-right')
    expect(move('bottom-right', 'ArrowDown')).toBe('bottom-right')
    expect(move('top-left', 'ArrowUp')).toBe('top-left')
    expect(move('top-left', 'ArrowLeft')).toBe('top-left')
  })

  it('passes through the island between the bottom corners when allowed', () => {
    expect(move('bottom-right', 'ArrowLeft', true)).toBe('center')
    expect(move('bottom-left', 'ArrowRight', true)).toBe('center')
    expect(move('center', 'ArrowLeft', true)).toBe('bottom-left')
    expect(move('center', 'ArrowRight', true)).toBe('bottom-right')
    expect(move('center', 'ArrowUp', true)).toBe('center')
    expect(move('top-right', 'ArrowLeft', true)).toBe('top-left')
  })
})
