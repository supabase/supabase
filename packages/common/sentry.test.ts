import { describe, expect, it } from 'vitest'

import { filterSentryEvent } from './sentry'

const enabled = { isPlatform: true, hasConsent: true }

describe('which errors get sent to Sentry', () => {
  it.each([undefined, {}, { third_party_code: false }, { third_party_code: 'false' }])(
    'sends app errors without changing their details: %j',
    (tags) => {
      const event = { tags, exception: { values: [{ value: 'Page crashed' }] } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
    }
  )

  it.each([true, 'true'])('drops errors marked as coming from outside the app: %s', (tag) => {
    expect(filterSentryEvent({ tags: { third_party_code: tag } }, enabled)).toBeNull()
  })

  it.each([true, 'true'])(
    'sends page crashes even when the code location is missing: %s',
    (tag) => {
      const event = {
        tags: { third_party_code: true, globalErrorBoundary: tag },
        exception: { values: [{ value: 'Page crashed' }] },
      }
      expect(filterSentryEvent(event, enabled)).toBe(event)
    }
  )

  it.each([undefined, false, 'false', null, 1])(
    'drops errors from outside the app unless marked as a page crash: %s',
    (tag) => {
      expect(
        filterSentryEvent({ tags: { third_party_code: true, globalErrorBoundary: tag } }, enabled)
      ).toBeNull()
    }
  )

  it.each([
    { isPlatform: false, hasConsent: true },
    { isPlatform: true, hasConsent: false },
    { isPlatform: false, hasConsent: false },
  ])('drops all errors and page crashes when reporting is turned off: %j', (settings) => {
    for (const tags of [undefined, { globalErrorBoundary: true, third_party_code: true }]) {
      expect(filterSentryEvent({ tags }, settings)).toBeNull()
    }
  })
})
