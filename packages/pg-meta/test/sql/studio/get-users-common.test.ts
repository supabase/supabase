import { describe, expect, test } from 'vitest'

import { prefixToUUID, stringRange } from '../../../src/sql/studio/get-users-common'

describe('prefixToUUID', () => {
  test('returns UUID template with no prefix', () => {
    const result = prefixToUUID('', false)
    expect(result).toBe('00000000-0000-0000-0000-000000000000')
  })

  test('returns UUID template with no prefix (max=true)', () => {
    const result = prefixToUUID('', true)
    expect(result).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff')
  })

  test('returns UUID with short prefix', () => {
    const result = prefixToUUID('abc', false)
    expect(result).toBe('abc00000-0000-4000-8000-000000000000')
  })

  test('returns UUID with short prefix (max=true)', () => {
    const result = prefixToUUID('abc', true)
    expect(result).toBe('abcfffff-ffff-4fff-bfff-ffffffffffff')
  })

  test('returns UUID with prefix up to first hyphen', () => {
    const result = prefixToUUID('12345678', false)
    expect(result).toBe('12345678-0000-4000-8000-000000000000')
  })

  test('returns UUID with prefix up to first hyphen (max=true)', () => {
    const result = prefixToUUID('12345678', true)
    expect(result).toBe('12345678-ffff-4fff-bfff-ffffffffffff')
  })

  test('returns UUID with prefix including first hyphen', () => {
    const result = prefixToUUID('12345678-', false)
    expect(result).toBe('12345678-0000-4000-8000-000000000000')
  })

  test('returns UUID with prefix extending into second section', () => {
    const result = prefixToUUID('12345678-1234', false)
    expect(result).toBe('12345678-1234-4000-8000-000000000000')
  })

  test('returns UUID with prefix extending into third section (before position 15)', () => {
    const result = prefixToUUID('12345678-1234-', false)
    expect(result).toBe('12345678-1234-4000-8000-000000000000')
  })

  test('returns UUID with prefix at position 15 (includes version)', () => {
    const result = prefixToUUID('12345678-1234-5', false)
    expect(result).toBe('12345678-1234-5000-8000-000000000000')
  })

  test('returns UUID with prefix extending into fourth section (before position 20)', () => {
    const result = prefixToUUID('12345678-1234-5678-', false)
    expect(result).toBe('12345678-1234-5678-8000-000000000000')
  })

  test('returns UUID with prefix extending into fourth section (before position 20, max=true)', () => {
    const result = prefixToUUID('12345678-1234-5678-', true)
    expect(result).toBe('12345678-1234-5678-bfff-ffffffffffff')
  })

  test('returns UUID with prefix at position 20 (includes variant)', () => {
    const result = prefixToUUID('12345678-1234-5678-9', false)
    expect(result).toBe('12345678-1234-5678-9000-000000000000')
  })

  test('returns UUID with prefix at position 20 (includes variant, max=true)', () => {
    const result = prefixToUUID('12345678-1234-5678-9', true)
    expect(result).toBe('12345678-1234-5678-9fff-ffffffffffff')
  })

  test('returns UUID with long prefix', () => {
    const result = prefixToUUID('12345678-1234-5678-9abc-def', false)
    expect(result).toBe('12345678-1234-5678-9abc-def000000000')
  })

  test('returns UUID with long prefix (max=true)', () => {
    const result = prefixToUUID('12345678-1234-5678-9abc-def', true)
    expect(result).toBe('12345678-1234-5678-9abc-deffffffffff')
  })

  test('returns UUID with full length prefix', () => {
    const result = prefixToUUID('12345678-1234-5678-9abc-def123456789', false)
    expect(result).toBe('12345678-1234-5678-9abc-def123456789')
  })

  test('returns UUID with full length prefix (max=true)', () => {
    const result = prefixToUUID('12345678-1234-5678-9abc-def123456789', true)
    expect(result).toBe('12345678-1234-5678-9abc-def123456789')
  })

  test('returns UUID with prefix longer than template', () => {
    const result = prefixToUUID('12345678-1234-5678-9abc-def123456789extra', false)
    expect(result).toBe('12345678-1234-5678-9abc-def123456789')
  })

  test('maintains hyphen positions in UUID format', () => {
    const result = prefixToUUID('a', false)
    expect(result).toBe('a0000000-0000-4000-8000-000000000000')
    expect(result.match(/-/g)?.length).toBe(4)
    expect(result[8]).toBe('-')
    expect(result[13]).toBe('-')
    expect(result[18]).toBe('-')
    expect(result[23]).toBe('-')
  })

  test('sets version nibble to 4 when prefix is shorter than position 15', () => {
    const result = prefixToUUID('12345678-1234', false)
    expect(result[14]).toBe('4')
  })

  test('sets variant to 8 when prefix is shorter than position 20 and max=false', () => {
    const result = prefixToUUID('12345678-1234-5678', false)
    expect(result[19]).toBe('8')
  })

  test('sets variant to b when prefix is shorter than position 20 and max=true', () => {
    const result = prefixToUUID('12345678-1234-5678', true)
    expect(result[19]).toBe('b')
  })

  test('fills remaining positions with f when max=true', () => {
    const result = prefixToUUID('abc', true)
    expect(result).toBe('abcfffff-ffff-4fff-bfff-ffffffffffff')
    // Check that all '0' characters in the template are replaced with 'f'
    expect(result).not.toContain('0')
    // Check that hyphens are preserved
    expect(result[8]).toBe('-')
    expect(result[13]).toBe('-')
    expect(result[18]).toBe('-')
    expect(result[23]).toBe('-')
  })
})

describe('stringRange', () => {
  test('returns empty string and undefined for empty prefix', () => {
    const result = stringRange('')
    expect(result).toEqual(['', undefined])
  })

  test('returns range for single character', () => {
    const result = stringRange('a')
    expect(result).toEqual(['a', 'b'])
  })

  test('returns range for multiple characters', () => {
    const result = stringRange('abc')
    expect(result).toEqual(['abc', 'abd'])
  })

  test('returns range for string with spaces', () => {
    const result = stringRange('hello world')
    expect(result).toEqual(['hello world', 'hello worle'])
  })

  test('returns range for string ending with numbers', () => {
    const result = stringRange('test123')
    expect(result).toEqual(['test123', 'test124'])
  })

  test('returns range for string with uppercase letters', () => {
    const result = stringRange('ABC')
    expect(result).toEqual(['ABC', 'ABD'])
  })

  test('appends space for tilde character to avoid collation issues', () => {
    const result = stringRange('test~')
    expect(result).toEqual(['test~', 'test~ '])
  })

  test('appends space for characters beyond tilde in ASCII', () => {
    const result = stringRange('test\x7F') // DEL character
    expect(result).toEqual(['test\x7F', 'test\x7F '])
  })

  test('increments last character correctly for various ASCII characters', () => {
    expect(stringRange('a')).toEqual(['a', 'b'])
    expect(stringRange('z')).toEqual(['z', 'z~']) // Special case: appends '~' to avoid collation issues
    expect(stringRange('A')).toEqual(['A', 'B'])
    expect(stringRange('Z')).toEqual(['Z', '['])
    expect(stringRange('0')).toEqual(['0', '1'])
    expect(stringRange('9')).toEqual(['9', ':'])
  })

  test('handles special characters', () => {
    expect(stringRange('test!')).toEqual(['test!', 'test"'])
    expect(stringRange('test@')).toEqual(['test@', 'testA'])
    expect(stringRange('test#')).toEqual(['test#', 'test$'])
  })

  test('handles underscore', () => {
    const result = stringRange('test_')
    expect(result).toEqual(['test_', 'test`'])
  })

  test('handles hyphen', () => {
    const result = stringRange('test-')
    expect(result).toEqual(['test-', 'test.'])
  })

  test('handles space correctly', () => {
    const result = stringRange('test ')
    expect(result).toEqual(['test ', 'test!'])
  })

  test('appends tilde for strings ending with lowercase z', () => {
    expect(stringRange('xyz')).toEqual(['xyz', 'xyz~'])
    expect(stringRange('jazz')).toEqual(['jazz', 'jazz~'])
  })

  test('handles mixed case strings ending with uppercase Z', () => {
    expect(stringRange('testZ')).toEqual(['testZ', 'test['])
  })

  test('handles strings ending with tilde', () => {
    expect(stringRange('test~')).toEqual(['test~', 'test~ '])
    expect(stringRange('~~~')).toEqual(['~~~', '~~~ '])
  })
})
