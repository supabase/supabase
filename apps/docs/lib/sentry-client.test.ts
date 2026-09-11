import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { filterSentryEvent } from './sentry-client'

describe('filterSentryEvent', () => {
  it('forwards first-party exceptions', () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: {
        values: [
          { stacktrace: { frames: [{ filename: 'https://supabase.com/docs/_next/app.js' }] } },
        ],
      },
    }
    expect(filterSentryEvent(event, { isPlatform: true, hasConsent: true })).toBe(event)
  })

  it('forwards errors without stack frames', () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: { values: [{ value: 'Page crashed' }] },
    }
    expect(filterSentryEvent(event, { isPlatform: true, hasConsent: true })).toBe(event)
  })

  it.each([true, 'true'])('drops third-party-only errors tagged %s', (tag) => {
    expect(
      filterSentryEvent(
        { type: undefined, tags: { third_party_code: tag } },
        { isPlatform: true, hasConsent: true }
      )
    ).toBeNull()
  })

  it.each([true, 'true'])('retains error-boundary crashes tagged %s', (tag) => {
    const event: ErrorEvent = {
      type: undefined,
      tags: { third_party_code: true, globalErrorBoundary: tag },
    }
    expect(filterSentryEvent(event, { isPlatform: true, hasConsent: true })).toBe(event)
  })

  it('does not forward errors outside the platform', () => {
    expect(
      filterSentryEvent({ type: undefined }, { isPlatform: false, hasConsent: true })
    ).toBeNull()
  })

  it('retains errors explicitly tagged as first-party', () => {
    const event: ErrorEvent = { type: undefined, tags: { third_party_code: false } }
    expect(filterSentryEvent(event, { isPlatform: true, hasConsent: true })).toBe(event)
  })

  it.each([
    {},
    { globalErrorBoundary: true },
    { globalErrorBoundary: 'true', third_party_code: true },
  ])(
    'does not forward errors without permission to report, including boundary crashes: %j',
    (tags) => {
      expect(
        filterSentryEvent({ type: undefined, tags }, { isPlatform: true, hasConsent: false })
      ).toBeNull()
    }
  )
})
