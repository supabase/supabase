import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './get-error-message'

describe('getErrorMessage', () => {
  it('returns null for null', () => {
    expect(getErrorMessage(null)).toBe(null)
  })

  it('returns null for undefined', () => {
    expect(getErrorMessage(undefined)).toBe(null)
  })

  it('returns the string for string errors', () => {
    expect(getErrorMessage('Something went wrong')).toBe('Something went wrong')
    expect(getErrorMessage('')).toBe('')
  })

  it('returns the message for Error instances', () => {
    expect(getErrorMessage(new Error('Failed to load'))).toBe('Failed to load')
    expect(getErrorMessage(new TypeError('Invalid type'))).toBe('Invalid type')
  })

  it('returns the message property for objects with message', () => {
    expect(getErrorMessage({ message: 'Custom error' })).toBe('Custom error')
    expect(getErrorMessage({ message: 123 })).toBe('123')
    expect(getErrorMessage({ message: null })).toBe('null')
  })

  it('converts other types to string', () => {
    expect(getErrorMessage(123)).toBe('123')
    expect(getErrorMessage(true)).toBe('true')
    expect(getErrorMessage(false)).toBe('false')
    expect(getErrorMessage({})).toBe('[object Object]')
    expect(getErrorMessage([])).toBe('')
  })

  it('handles objects without message property', () => {
    expect(getErrorMessage({ code: 500 })).toBe('[object Object]')
    expect(getErrorMessage({ error: 'test' })).toBe('[object Object]')
  })

  it('handles nested error objects', () => {
    expect(getErrorMessage({ message: { nested: 'error' } })).toBe('[object Object]')
  })
})
