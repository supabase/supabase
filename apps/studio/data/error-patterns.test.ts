import { describe, expect, it } from 'vitest'

import { ERROR_PATTERNS } from './error-patterns'

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
