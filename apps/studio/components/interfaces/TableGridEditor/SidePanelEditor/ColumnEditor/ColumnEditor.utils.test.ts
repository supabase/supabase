import { describe, expect, it } from 'vitest'
import {
  decodeCommentWithoutSensitivityFlag,
  encodeCommentWithSensitivityFlag,
  isSensitiveDataInComment,
  SENSITIVE_DATA_MARKER,
} from './ColumnEditor.utils'

describe('ColumnEditor.utils - sensitivity marker handling', () => {
  describe('isSensitiveDataInComment', () => {
    it('returns false for null, undefined, or empty comment', () => {
      expect(isSensitiveDataInComment(null)).toBe(false)
      expect(isSensitiveDataInComment(undefined)).toBe(false)
      expect(isSensitiveDataInComment('')).toBe(false)
      expect(isSensitiveDataInComment('   ')).toBe(false)
    })

    it('returns true when comment starts with [SENSITIVE]', () => {
      expect(isSensitiveDataInComment('[SENSITIVE]')).toBe(true)
      expect(isSensitiveDataInComment('[SENSITIVE] user email address')).toBe(true)
      expect(isSensitiveDataInComment('  [SENSITIVE] leading whitespace')).toBe(true)
    })

    it('returns false when [SENSITIVE] appears in the body of the comment and not as leading prefix', () => {
      expect(isSensitiveDataInComment('Fields marked [SENSITIVE] are PII')).toBe(false)
      expect(isSensitiveDataInComment('Do not treat as [SENSITIVE]')).toBe(false)
      expect(isSensitiveDataInComment('Contact email (NOT [SENSITIVE])')).toBe(false)
    })
  })

  describe('decodeCommentWithoutSensitivityFlag', () => {
    it('returns null for null, undefined, or empty comment', () => {
      expect(decodeCommentWithoutSensitivityFlag(null)).toBe(null)
      expect(decodeCommentWithoutSensitivityFlag(undefined)).toBe(null)
      expect(decodeCommentWithoutSensitivityFlag('')).toBe(null)
      expect(decodeCommentWithoutSensitivityFlag('   ')).toBe(null)
    })

    it('strips leading [SENSITIVE] marker when present', () => {
      expect(decodeCommentWithoutSensitivityFlag('[SENSITIVE]')).toBe(null)
      expect(decodeCommentWithoutSensitivityFlag('[SENSITIVE] user email address')).toBe(
        'user email address'
      )
      expect(decodeCommentWithoutSensitivityFlag('  [SENSITIVE]   spaced comment  ')).toBe(
        'spaced comment'
      )
    })

    it('trims whitespace when [SENSITIVE] is not present', () => {
      expect(decodeCommentWithoutSensitivityFlag('   clean comment   ')).toBe('clean comment')
    })

    it('preserves [SENSITIVE] when it appears within the user comment text', () => {
      expect(decodeCommentWithoutSensitivityFlag('Fields marked [SENSITIVE] are PII')).toBe(
        'Fields marked [SENSITIVE] are PII'
      )
      expect(decodeCommentWithoutSensitivityFlag('Do not treat as [SENSITIVE]')).toBe(
        'Do not treat as [SENSITIVE]'
      )
      expect(decodeCommentWithoutSensitivityFlag('Check [SENSITIVE] and [SENSITIVE] twice')).toBe(
        'Check [SENSITIVE] and [SENSITIVE] twice'
      )
    })

    it('strips only the leading [SENSITIVE] marker even if another appears in the body', () => {
      expect(
        decodeCommentWithoutSensitivityFlag('[SENSITIVE] Note: another [SENSITIVE] tag here')
      ).toBe('Note: another [SENSITIVE] tag here')
    })
  })

  describe('encodeCommentWithSensitivityFlag', () => {
    it('returns null when not sensitive and comment is empty', () => {
      expect(encodeCommentWithSensitivityFlag(null, false)).toBe(null)
      expect(encodeCommentWithSensitivityFlag(undefined, false)).toBe(null)
      expect(encodeCommentWithSensitivityFlag('', false)).toBe(null)
      expect(encodeCommentWithSensitivityFlag('   ', false)).toBe(null)
    })

    it('returns only the marker when sensitive and comment is empty', () => {
      expect(encodeCommentWithSensitivityFlag(null, true)).toBe(SENSITIVE_DATA_MARKER)
      expect(encodeCommentWithSensitivityFlag(undefined, true)).toBe(SENSITIVE_DATA_MARKER)
      expect(encodeCommentWithSensitivityFlag('', true)).toBe(SENSITIVE_DATA_MARKER)
      expect(encodeCommentWithSensitivityFlag('   ', true)).toBe(SENSITIVE_DATA_MARKER)
    })

    it('encodes sensitive comment with prefix', () => {
      expect(encodeCommentWithSensitivityFlag('user email address', true)).toBe(
        '[SENSITIVE] user email address'
      )
    })

    it('avoids duplicate prefix when comment was already prefixed', () => {
      expect(encodeCommentWithSensitivityFlag('[SENSITIVE] user email address', true)).toBe(
        '[SENSITIVE] user email address'
      )
    })

    it('strips leading prefix when sensitive toggle is turned off', () => {
      expect(encodeCommentWithSensitivityFlag('[SENSITIVE] user email address', false)).toBe(
        'user email address'
      )
      expect(encodeCommentWithSensitivityFlag('[SENSITIVE]', false)).toBe(null)
    })

    it('preserves [SENSITIVE] in body when sensitive toggle is turned off (no data loss)', () => {
      expect(encodeCommentWithSensitivityFlag('Fields marked [SENSITIVE] are PII', false)).toBe(
        'Fields marked [SENSITIVE] are PII'
      )
    })

    it('preserves [SENSITIVE] in body when sensitive toggle is turned on', () => {
      expect(encodeCommentWithSensitivityFlag('Fields marked [SENSITIVE] are PII', true)).toBe(
        '[SENSITIVE] Fields marked [SENSITIVE] are PII'
      )
    })
    it('preserves leading [SENSITIVE] in decoded form comments when commentIsDecoded is true', () => {
      expect(
        encodeCommentWithSensitivityFlag('[SENSITIVE] user entered comment', false, true)
      ).toBe('[SENSITIVE] user entered comment')

      expect(
        encodeCommentWithSensitivityFlag('[SENSITIVE] user entered comment', true, true)
      ).toBe('[SENSITIVE] [SENSITIVE] user entered comment')
    })
  })
})
