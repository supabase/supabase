import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { filterSentryEvent } from './sentry-client'

const enabled = { isPlatform: true, hasConsent: true }
const crash: ErrorEvent = {
  type: undefined,
  exception: { values: [{ type: 'Error', value: 'Page failed to render' }] },
}

describe('filterSentryEvent', () => {
  it('keeps application crashes, including errors without stack frames', () => {
    expect(filterSentryEvent(crash, enabled)).toBe(crash)
  })

  it.each([true, 'true'])('drops third-party-only errors tagged %s', (tag) => {
    const event = { ...crash, tags: { third_party_code: tag } }
    expect(filterSentryEvent(event, enabled)).toBeNull()
  })

  it.each([true, 'true'])(
    'keeps page crashes tagged %s even with third-party-only frames',
    (tag) => {
      const event = { ...crash, tags: { third_party_code: true, globalErrorBoundary: tag } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
    }
  )

  it.each([
    { isPlatform: false, hasConsent: true },
    { isPlatform: true, hasConsent: false },
  ])('respects reporting gates for page crashes: %j', (settings) => {
    const event = { ...crash, tags: { globalErrorBoundary: true } }
    expect(filterSentryEvent(event, settings)).toBeNull()
  })
})
