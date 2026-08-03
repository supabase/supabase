import { describe, expect, it } from 'vitest'

import { createClassifiedError, ERROR_PATTERNS } from './error-patterns'
import { ConnectionTimeoutError, UnknownAPIResponseError } from '@/types/api-errors'
import { ResponseError } from '@/types/base'

// Representative sample messages for each error class.
// Keep this in sync when adding new patterns — the test will fail if you don't.
const PATTERN_SAMPLES: Record<string, { matches: string[]; nonMatches: string[] }> = {
  ConnectionTimeoutError: {
    matches: [
      'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT',
      'connection terminated due to connection timeout',
      'ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT.',
      'Connection  Terminated  Due  To  Connection  Timeout', // extra whitespace
    ],
    nonMatches: [
      'connection timeout',
      'connection terminated',
      'query timed out',
      'idle connection timeout',
      '',
    ],
  },
}

describe('ERROR_PATTERNS registry', () => {
  it('has a PATTERN_SAMPLES entry for every registered pattern (keep samples in sync)', () => {
    for (const { ErrorClass } of ERROR_PATTERNS) {
      expect(
        PATTERN_SAMPLES,
        `Add a PATTERN_SAMPLES entry for '${ErrorClass.name}'`
      ).toHaveProperty(ErrorClass.name)
    }
  })

  describe('per-pattern match correctness', () => {
    for (const { ErrorClass, pattern } of ERROR_PATTERNS) {
      const samples = PATTERN_SAMPLES[ErrorClass.name]
      if (!samples) continue

      describe(ErrorClass.name, () => {
        it.each(samples.matches)('matches: %s', (msg) => {
          expect(pattern.test(msg)).toBe(true)
        })

        it.each(samples.nonMatches)('does not match: %s', (msg) => {
          expect(pattern.test(msg)).toBe(false)
        })
      })
    }
  })

  describe('no message matches more than one pattern', () => {
    const allSamples = Object.entries(PATTERN_SAMPLES).flatMap(([className, { matches }]) =>
      matches.map((msg) => ({ msg, sourceClass: className }))
    )

    it.each(allSamples)('$sourceClass sample "$msg" matches exactly one pattern', ({ msg }) => {
      const matched = ERROR_PATTERNS.filter(({ pattern }) => pattern.test(msg))
      expect(matched.length).toBe(1)
    })
  })
})

describe('createClassifiedError', () => {
  it('returns the matching subclass for a known pattern', () => {
    const error = createClassifiedError('CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT')
    expect(error).toBeInstanceOf(ConnectionTimeoutError)
    expect(error.errorType).toBe('connection-timeout')
  })

  it('matches case-insensitively', () => {
    expect(createClassifiedError('connection terminated due to connection timeout')).toBeInstanceOf(
      ConnectionTimeoutError
    )
  })

  it('matches a pattern embedded in a longer message', () => {
    expect(
      createClassifiedError(
        'ERROR: FAILED TO RUN SQL QUERY: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT.'
      )
    ).toBeInstanceOf(ConnectionTimeoutError)
  })

  it('falls back to UnknownAPIResponseError for an unmatched message', () => {
    const error = createClassifiedError('something went wrong')
    expect(error).toBeInstanceOf(UnknownAPIResponseError)
    expect(error).toBeInstanceOf(ResponseError)
  })

  it('falls back to UnknownAPIResponseError for an empty message', () => {
    expect(createClassifiedError('')).toBeInstanceOf(UnknownAPIResponseError)
  })

  it('falls back to UnknownAPIResponseError for an undefined message', () => {
    expect(createClassifiedError(undefined)).toBeInstanceOf(UnknownAPIResponseError)
  })

  it('always returns a ResponseError instance', () => {
    expect(createClassifiedError('anything')).toBeInstanceOf(ResponseError)
  })

  it('forwards every constructor argument to the chosen class', () => {
    const metadata = { cost: 12, sql: 'select 1' }
    const error = createClassifiedError(
      'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT',
      503,
      'req-abc',
      30,
      '/rest/v1/table',
      metadata,
      'ERROR: 08000: CONNECTION TERMINATED'
    )

    expect(error).toBeInstanceOf(ConnectionTimeoutError)
    expect(error.message).toBe('CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT')
    expect(error.code).toBe(503)
    expect(error.requestId).toBe('req-abc')
    expect(error.retryAfter).toBe(30)
    expect(error.requestPathname).toBe('/rest/v1/table')
    expect(error.metadata).toEqual(metadata)
    expect(error.formattedError).toBe('ERROR: 08000: CONNECTION TERMINATED')
  })

  it('forwards constructor arguments on the fallback path too', () => {
    const error = createClassifiedError('some error', 500, 'req-xyz')
    expect(error).toBeInstanceOf(UnknownAPIResponseError)
    expect(error.code).toBe(500)
    expect(error.requestId).toBe('req-xyz')
  })

  it('applies the ResponseError default message when message is undefined', () => {
    expect(createClassifiedError(undefined).message).toBe(
      'API error happened while trying to communicate with the server.'
    )
  })
})
