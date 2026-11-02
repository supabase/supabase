import { describe, expect, it } from 'vitest'

import { ISO_SHAPE_POSES, ISO_SHAPES, type IsoShapeName } from './IsoShape.shapes'

const POSED_SHAPES = Object.keys(ISO_SHAPE_POSES).filter(
  (name): name is IsoShapeName => name in ISO_SHAPES
)

const getLifts = (name: IsoShapeName) => {
  const posed = ISO_SHAPE_POSES[name]?.(1) ?? []
  return posed.map((box, index) => box.z - ISO_SHAPES[name][index].z)
}

describe('ISO_SHAPE_POSES', () => {
  it.each(POSED_SHAPES)('returns the resting %s shape at activation 0', (name) => {
    expect(ISO_SHAPE_POSES[name]?.(0)).toEqual(ISO_SHAPES[name])
  })

  it('lifts only the visible row of the row level security shape', () => {
    expect(getLifts('Row Level Security')).toEqual([0, 0.6, 0, 0])
  })

  it.each([
    { name: 'Production' as const, step: 0.3 },
    { name: 'Database' as const, step: 0.25 },
  ])('spreads each $name level by $step', ({ name, step }) => {
    getLifts(name).forEach((lift, index) => expect(lift).toBeCloseTo(index * step))
  })
})
