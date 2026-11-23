import { describe, expect, it } from 'vitest'

import { getPlanCardsEntryAnimation } from './PlanCards.utils'

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
