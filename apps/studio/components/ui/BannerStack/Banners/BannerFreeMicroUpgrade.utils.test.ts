import { describe, expect, it } from 'vitest'

import { isFreeMicroUpgradeBannerSnoozed } from './BannerFreeMicroUpgrade.utils'

const now = '2026-11-23T12:00:00.000Z'

describe('isFreeMicroUpgradeBannerSnoozed', () => {
  it('is not snoozed when never dismissed', () => {
    expect(isFreeMicroUpgradeBannerSnoozed(null, now)).toBe(false)
    expect(isFreeMicroUpgradeBannerSnoozed(undefined, now)).toBe(false)
  })

  it('is snoozed within 7 days of dismissal', () => {
    expect(isFreeMicroUpgradeBannerSnoozed('2026-11-17T12:00:01.000Z', now)).toBe(true)
  })

  it('resurfaces once 7 days have passed', () => {
    expect(isFreeMicroUpgradeBannerSnoozed('2026-11-16T12:00:00.000Z', now)).toBe(false)
    expect(isFreeMicroUpgradeBannerSnoozed('2026-10-01T00:00:00.000Z', now)).toBe(false)
  })

  it('ignores legacy or invalid stored values', () => {
    expect(isFreeMicroUpgradeBannerSnoozed(true as unknown as string, now)).toBe(false)
    expect(isFreeMicroUpgradeBannerSnoozed('not-a-date', now)).toBe(false)
  })
})
