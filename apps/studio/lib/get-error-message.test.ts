import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './get-error-message'

describe('getErrorMessage', () => {
  it('returns the message for Error instances', () => {
    expect(getErrorMessage(new Error('Failed to load'))).toBe('Failed to load')
    expect(getErrorMessage(new TypeError('Invalid type'))).toBe('Invalid type')
  })

  it('returns a string throw, trimmed', () => {
    expect(getErrorMessage('Something went wrong')).toBe('Something went wrong')
    expect(getErrorMessage('  boom  ')).toBe('boom')
  })

  it('reads a string message off a plain object', () => {
    expect(getErrorMessage({ message: 'Custom error' })).toBe('Custom error')
  })

  it('returns null when there is no usable message', () => {
    expect(getErrorMessage(null)).toBe(null)
    expect(getErrorMessage(undefined)).toBe(null)
    expect(getErrorMessage('')).toBe(null)
    expect(getErrorMessage('   ')).toBe(null)
    expect(getErrorMessage(123)).toBe(null)
    expect(getErrorMessage(true)).toBe(null)
    expect(getErrorMessage([])).toBe(null)
  })

  it('never surfaces a stringified object as the message', () => {
    expect(getErrorMessage({})).toBe(null)
    expect(getErrorMessage({ code: 500 })).toBe(null)
    expect(getErrorMessage({ error: 'test' })).toBe(null)
    expect(getErrorMessage({ message: 123 })).toBe(null)
    expect(getErrorMessage({ message: null })).toBe(null)
    expect(getErrorMessage({ message: { nested: 'error' } })).toBe(null)
  })

  it('returns the fallback instead of null when one is given', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
    expect(getErrorMessage({}, 'fallback')).toBe('fallback')
    expect(getErrorMessage({ message: '   ' }, 'fallback')).toBe('fallback')
    expect(getErrorMessage(123, 'fallback')).toBe('fallback')
  })

  it('prefers a real message over the fallback', () => {
    expect(getErrorMessage(new Error('Rewrite failed'), 'fallback')).toBe('Rewrite failed')
    expect(getErrorMessage({ message: 'Bad request' }, 'fallback')).toBe('Bad request')
  })
})
