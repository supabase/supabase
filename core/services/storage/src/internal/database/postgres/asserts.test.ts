import { describe, expect, it } from 'vitest'
import { assertValidSignal } from './asserts'

describe('PostgreSQL abort-signal assertions', () => {
  it('accepts absent and active AbortSignals', () => {
    expect(() => assertValidSignal()).not.toThrow()
    expect(() => assertValidSignal(new AbortController().signal)).not.toThrow()
  })

  it('rejects non-AbortSignal values', () => {
    expect(() => assertValidSignal({} as AbortSignal)).toThrow(
      'Expected signal to be an instance of AbortSignal'
    )
  })

  it('rejects pre-aborted signals with a fresh AbortError', () => {
    const signal = AbortSignal.abort()

    let first: unknown
    let second: unknown
    try {
      assertValidSignal(signal)
    } catch (error) {
      first = error
    }
    try {
      assertValidSignal(signal)
    } catch (error) {
      second = error
    }

    expect(first).toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
      message: 'Query was aborted',
    })
    expect(second).not.toBe(first)
  })
})
