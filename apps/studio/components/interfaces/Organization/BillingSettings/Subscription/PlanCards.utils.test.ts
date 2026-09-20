import { describe, expect, it } from 'vitest'

import { getPlanCardsEntryAnimation } from './PlanCards.utils'

describe('getPlanCardsEntryAnimation', () => {
  it('returns no animation props when no entry delay is given', () => {
    const animation = getPlanCardsEntryAnimation(undefined)

    expect(animation.container).toEqual({})
    expect(animation.card).toBeUndefined()
  })

  it('staggers the cards after the container delay', () => {
    const animation = getPlanCardsEntryAnimation(0.4)

    expect(animation.container.initial).toBe('hidden')
    expect(animation.container.animate).toBe('visible')
    expect(animation.card).toBeDefined()

    const visible = animation.container.variants?.visible as { transition: Record<string, number> }
    expect(visible.transition.delayChildren).toBeCloseTo(0.6)
    expect(visible.transition.staggerChildren).toBe(0.08)
  })

  it('treats a zero delay as an animation, not as absent', () => {
    const animation = getPlanCardsEntryAnimation(0)

    expect(animation.container.initial).toBe('hidden')
    expect(animation.card).toBeDefined()
  })
})
