import { describe, expect, it } from 'vitest'

import { SELECT_26_BANNER_PRIORITY, shouldShowSelect26Banner } from './BannerSelect2026.utils'

const visibleState = {
  isPlatform: true,
  dismissalLoaded: true,
  isActive: true,
  isDismissed: false,
}

describe('shouldShowSelect26Banner', () => {
  it('shows the promotion on hosted Studio', () => {
    expect(shouldShowSelect26Banner(visibleState)).toBe(true)
  })

  it.each([
    ['self-hosted Studio', { isPlatform: false }],
    ['before dismissal state loads', { dismissalLoaded: false }],
    ['after campaign expiry', { isActive: false }],
    ['after dismissal', { isDismissed: true }],
  ])('hides the promotion %s', (_, state) => {
    expect(shouldShowSelect26Banner({ ...visibleState, ...state })).toBe(false)
  })

  it('sits behind every existing non-negative banner priority', () => {
    expect(SELECT_26_BANNER_PRIORITY).toBe(-1)
  })
})
