import { describe, expect, it } from 'vitest'

import { getLiftedSide, getPlanCardsEntryAnimation } from './PlanCards.utils'

describe('getPlanCardsEntryAnimation', () => {
  it.each([0, 0.4])('staggers the cards after a container delay of %s', (entryDelay) => {
    const animation = getPlanCardsEntryAnimation(entryDelay)

    expect(animation.container.initial).toBe('hidden')
    expect(animation.container.animate).toBe('visible')

    const visible = animation.container.variants.visible as { transition: Record<string, number> }
    expect(visible.transition.delayChildren).toBeGreaterThan(entryDelay)
    expect(visible.transition.staggerChildren).toBeGreaterThan(0)
  })
})

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
