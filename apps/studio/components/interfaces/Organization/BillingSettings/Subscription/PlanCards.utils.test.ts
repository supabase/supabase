import { describe, expect, it } from 'vitest'

import { getLiftedSide } from './PlanCards.utils'

describe('getLiftedSide', () => {
  it('marks only the direct neighbors of the lifted card', () => {
    const sides = [0, 1, 2, 3].map((index) => getLiftedSide({ index, liftedIndex: 1 }))
    expect(sides).toEqual(['right', undefined, 'left', undefined])
  })

  it('marks no card when no card is lifted', () => {
    const sides = [0, 1, 2, 3].map((index) => getLiftedSide({ index, liftedIndex: -1 }))
    expect(sides).toEqual([undefined, undefined, undefined, undefined])
  })
})
