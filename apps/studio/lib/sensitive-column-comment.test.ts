import { describe, expect, it } from 'vitest'

import {
  decodeSensitiveComment,
  encodeSensitiveComment,
  isSensitiveComment,
} from './sensitive-column-comment'

describe('isSensitiveComment', () => {
  it('detects a leading marker', () => {
    expect(isSensitiveComment('[SENSITIVE] secret')).toBe(true)
    expect(isSensitiveComment('[SENSITIVE]')).toBe(true)
  })

  it('detects a legacy trailing marker', () => {
    expect(isSensitiveComment('secret [SENSITIVE]')).toBe(true)
  })

  it('detects a marker despite surrounding whitespace', () => {
    expect(isSensitiveComment('  [SENSITIVE] secret')).toBe(true)
    expect(isSensitiveComment('email [SENSITIVE] ')).toBe(true)
  })

  it('ignores a marker in the middle of the comment', () => {
    expect(isSensitiveComment('Fields marked [SENSITIVE] are PII')).toBe(false)
  })

  it('returns false for empty input', () => {
    expect(isSensitiveComment('')).toBe(false)
    expect(isSensitiveComment(null)).toBe(false)
    expect(isSensitiveComment(undefined)).toBe(false)
  })
})

describe('decodeSensitiveComment', () => {
  it('strips a leading marker and one following space', () => {
    expect(decodeSensitiveComment('[SENSITIVE] secret')).toBe('secret')
  })

  it('strips a legacy trailing marker and one preceding space', () => {
    expect(decodeSensitiveComment('secret [SENSITIVE]')).toBe('secret')
  })

  it('returns null for a bare marker', () => {
    expect(decodeSensitiveComment('[SENSITIVE]')).toBeNull()
  })

  it('preserves a mid-string marker verbatim', () => {
    expect(decodeSensitiveComment('Fields marked [SENSITIVE] are PII')).toBe(
      'Fields marked [SENSITIVE] are PII'
    )
  })

  it('returns null for empty input', () => {
    expect(decodeSensitiveComment('')).toBeNull()
    expect(decodeSensitiveComment(null)).toBeNull()
  })
})

describe('encodeSensitiveComment', () => {
  it('prepends the marker when sensitive', () => {
    expect(encodeSensitiveComment('hello', true)).toBe('[SENSITIVE] hello')
  })

  it('stores a bare marker when sensitive with no comment', () => {
    expect(encodeSensitiveComment('', true)).toBe('[SENSITIVE]')
    expect(encodeSensitiveComment(null, true)).toBe('[SENSITIVE]')
  })

  it('leaves a non-sensitive comment untouched', () => {
    expect(encodeSensitiveComment('hello', false)).toBe('hello')
  })

  it('returns null for an empty non-sensitive comment', () => {
    expect(encodeSensitiveComment('', false)).toBeNull()
  })

  it('does not mangle a mid-string marker when not sensitive', () => {
    expect(encodeSensitiveComment('a [SENSITIVE] b', false)).toBe('a [SENSITIVE] b')
  })

  it('preserves decoded text that itself starts with the marker', () => {
    expect(encodeSensitiveComment('[SENSITIVE] secret', true)).toBe(
      '[SENSITIVE] [SENSITIVE] secret'
    )
  })
})

describe('decode then encode round trip', () => {
  it('migrates a legacy trailing marker to a prefix', () => {
    expect(encodeSensitiveComment(decodeSensitiveComment('secret [SENSITIVE]'), true)).toBe(
      '[SENSITIVE] secret'
    )
  })

  it('migrates a legacy trailing marker with trailing whitespace', () => {
    expect(encodeSensitiveComment(decodeSensitiveComment('email [SENSITIVE] '), true)).toBe(
      '[SENSITIVE] email'
    )
  })

  it('does not double-prefix an already-encoded comment', () => {
    expect(encodeSensitiveComment(decodeSensitiveComment('[SENSITIVE] secret'), true)).toBe(
      '[SENSITIVE] secret'
    )
  })
})
