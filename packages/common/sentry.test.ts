import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BROWSER_NOISE_IGNORE_ERRORS,
  BROWSER_TRANSLATION_DOM_ERRORS,
  filterSentryEvent,
  isBrowserTranslationDomError,
  isPageTranslated,
} from './sentry'

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

  it.each([true, 'true'])(
    'sends every Studio empty-body diagnostic without sampling: %s',
    (tag) => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const event = { tags: { empty_body_diagnostic: tag } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
      expect(event.tags).toEqual({ empty_body_diagnostic: tag, codeSampleRate: '1' })
      expect(random).not.toHaveBeenCalled()
    }
  )

  it.each([false, 'false', null])(
    'still samples events whose empty-body diagnostic tag is not set: %s',
    (tag) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      expect(filterSentryEvent({ tags: { empty_body_diagnostic: tag } }, enabled)).toBeNull()
    }
  )

  it('drops empty-body diagnostics when reporting is turned off', () => {
    const tags = { empty_body_diagnostic: 'true' }
    expect(filterSentryEvent({ tags }, { isPlatform: true, hasConsent: false })).toBeNull()
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

describe('browser-translation DOM errors', () => {
  it.each([
    [
      'Chrome removeChild',
      'NotFoundError',
      "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
    ],
    [
      'Chrome insertBefore',
      'NotFoundError',
      "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
    ],
    [
      'Firefox removeChild',
      'NotFoundError',
      'Node.removeChild: The node to be removed is not a child of this node',
    ],
    [
      'Firefox insertBefore',
      'NotFoundError',
      'Node.insertBefore: Child to insert before is not a child of this node',
    ],
    ['Safari', 'NotFoundError', 'The object can not be found here.'],
  ])('recognizes the %s error', (_name, type, value) => {
    expect(isBrowserTranslationDomError({ exception: { values: [{ type, value }] } })).toBe(true)
  })

  it('recognizes the error from the event message', () => {
    expect(
      isBrowserTranslationDomError({
        message: 'Node.removeChild: The node to be removed is not a child of this node',
      })
    ).toBe(true)
  })

  it.each([
    "Cannot read properties of null (reading 'parentNode')",
    "Cannot read properties of null (reading 'removeChild')",
    'Application error',
  ])('does not treat other errors as translation crashes: %s', (value) => {
    expect(
      isBrowserTranslationDomError({ exception: { values: [{ type: 'TypeError', value }] } })
    ).toBe(false)
    expect(isBrowserTranslationDomError({})).toBe(false)
  })

  it('matches the last exception, the main one, not the members of an AggregateError', () => {
    const member = { type: 'NotFoundError', value: "Failed to execute 'removeChild' on 'Node'" }
    const main = { type: 'AggregateError', value: 'Multiple errors' }

    expect(isBrowserTranslationDomError({ exception: { values: [member, main] } })).toBe(false)
    expect(isBrowserTranslationDomError({ exception: { values: [main, member] } })).toBe(true)
  })

  it('keeps the generic null reads in the always-ignored list, and the DOM errors out of it', () => {
    expect(BROWSER_NOISE_IGNORE_ERRORS).toContain(
      "Cannot read properties of null (reading 'parentNode')"
    )
    for (const pattern of BROWSER_TRANSLATION_DOM_ERRORS) {
      expect(BROWSER_NOISE_IGNORE_ERRORS).not.toContain(pattern)
    }
  })

  it.each([true, 'true'])(
    'skips the 1%% sampling for errors tagged as browser translation: %s',
    (tag) => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const event = { tags: { browser_translation: tag } }
      expect(filterSentryEvent(event, enabled)).toBe(event)
      expect(event.tags).toEqual({ browser_translation: tag, codeSampleRate: '1' })
      expect(random).not.toHaveBeenCalled()
    }
  )

  it('still drops tagged errors from outside the app', () => {
    expect(
      filterSentryEvent({ tags: { browser_translation: true, third_party_code: true } }, enabled)
    ).toBeNull()
  })
})

describe('isPageTranslated', () => {
  const makeDoc = (classes: string[], hasFont = false) => ({
    documentElement: { classList: { contains: (c: string) => classes.includes(c) } },
    querySelector: () => (hasFont ? {} : null),
  })

  it.each(['translated-ltr', 'translated-rtl'])('detects the %s class on <html>', (cls) => {
    expect(isPageTranslated(makeDoc([cls]) as never)).toBe(true)
  })

  it('detects Google Translate font wrappers', () => {
    expect(isPageTranslated(makeDoc([], true) as never)).toBe(true)
  })

  it('returns false for a document with no root element', () => {
    const doc = { documentElement: null, querySelector: () => ({}) }
    expect(isPageTranslated(doc as never)).toBe(false)
  })

  it('returns false for an untranslated page', () => {
    expect(isPageTranslated(makeDoc(['dark']) as never)).toBe(false)
  })
})
