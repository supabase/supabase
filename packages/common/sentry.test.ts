import { afterEach, describe, expect, it, vi } from 'vitest'

import { filterSentryEvent } from './sentry'

const enabled = { isPlatform: true, hasConsent: true }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('which errors get sent to Sentry', () => {
  it.each([undefined, {}, { third_party_code: false }, { third_party_code: 'false' }])(
    'sends sampled app errors and records the sample rate: %j',
    (tags) => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const event = { tags, exception: { values: [{ value: 'Page crashed' }] } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
      expect(event.tags).toEqual({ ...tags, codeSampleRate: '0.01' })
    }
  )

  it.each([true, 'true'])('drops errors marked as coming from outside the app: %s', (tag) => {
    expect(filterSentryEvent({ tags: { third_party_code: tag } }, enabled)).toBeNull()
  })

  it.each([true, 'true'])(
    'sends page crashes even when the code location is missing: %s',
    (tag) => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const event = {
        tags: { third_party_code: true, globalErrorBoundary: tag },
        exception: { values: [{ value: 'Page crashed' }] },
      }
      expect(filterSentryEvent(event, enabled)).toBe(event)
      expect(event.tags).toEqual({
        third_party_code: true,
        globalErrorBoundary: tag,
        codeSampleRate: '1',
      })
      expect(random).not.toHaveBeenCalled()
    }
  )

  it.each([
    [0.0099, true],
    [0.01, false],
  ])('sends 1%% of errors that did not crash the page: %s', (randomValue, isSent) => {
    vi.spyOn(Math, 'random').mockReturnValue(randomValue)
    const event = { tags: {}, exception: { values: [{ value: 'Application error' }] } }

    expect(filterSentryEvent(event, enabled) === event).toBe(isSent)
  })

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
