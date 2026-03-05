import { describe, expect, test } from 'vitest'

import { isFilterRelatedError } from './GridError.utils'

describe('isFilterRelatedError', () => {
  test('returns false for null or undefined', () => {
    expect(isFilterRelatedError(null)).toBe(false)
    expect(isFilterRelatedError(undefined)).toBe(false)
  })

  test('returns false for empty string', () => {
    expect(isFilterRelatedError('')).toBe(false)
  })

  test('returns false for unrelated error messages', () => {
    expect(isFilterRelatedError('connection refused')).toBe(false)
    expect(isFilterRelatedError('permission denied for table users')).toBe(false)
    expect(isFilterRelatedError('relation "users" does not exist')).toBe(false)
    expect(isFilterRelatedError('Query cost exceeds threshold')).toBe(false)
  })

  test('detects invalid input syntax errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22P02: invalid input syntax for type inet: "192.168.3"'
      )
    ).toBe(true)
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22P02: invalid input syntax for type integer: "abc"'
      )
    ).toBe(true)
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22P02: invalid input syntax for type uuid: "not-a-uuid"'
      )
    ).toBe(true)
  })

  test('detects operator does not exist errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 42883: operator does not exist: text > integer'
      )
    ).toBe(true)
  })

  test('detects collation errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: could not determine which collation to use for string comparison'
      )
    ).toBe(true)
  })

  test('detects invalid enum value errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22P02: invalid input value for enum status: "badvalue"'
      )
    ).toBe(true)
  })

  test('detects malformed array literal errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22P02: malformed array literal: "not-an-array"'
      )
    ).toBe(true)
  })

  test('detects invalid byte sequence errors', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 22021: invalid byte sequence for encoding "UTF8"'
      )
    ).toBe(true)
  })

  test('detects syntax errors from invalid IS operator values', () => {
    expect(
      isFilterRelatedError(
        'Failed to run sql query: ERROR: 42601: syntax error at or near "sdfsdf"'
      )
    ).toBe(true)
  })
})
