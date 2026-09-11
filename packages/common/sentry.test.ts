import { describe, expect, it } from 'vitest'

import { filterSentryEvent } from './sentry'

const enabled = { isPlatform: true, hasConsent: true }

describe('filterSentryEvent', () => {
  it.each([undefined, {}, { third_party_code: false }, { third_party_code: 'false' }])(
    'preserves application errors and their payloads with tags %j',
    (tags) => {
      const event = { tags, exception: { values: [{ value: 'Page crashed' }] } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
    }
  )

  it.each([true, 'true'])('drops third-party errors tagged %s', (tag) => {
    expect(filterSentryEvent({ tags: { third_party_code: tag } }, enabled)).toBeNull()
  })

  it.each([true, 'true'])('preserves boundary crashes tagged %s without stack frames', (tag) => {
    const event = {
      tags: { third_party_code: true, globalErrorBoundary: tag },
      exception: { values: [{ value: 'Page crashed' }] },
    }
    expect(filterSentryEvent(event, enabled)).toBe(event)
  })

  it.each([undefined, false, 'false', null, 1])(
    'does not treat boundary tag %s as a crash',
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
  ])('blocks all errors when reporting is disabled: %j', (settings) => {
    for (const tags of [undefined, { globalErrorBoundary: true, third_party_code: true }]) {
      expect(filterSentryEvent({ tags }, settings)).toBeNull()
    }
  })
})
