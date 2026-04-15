import {
  normalizeEscapedNewlines,
  normalizeSmsTemplateValue,
  SMS_TEMPLATE_KEY,
} from 'components/interfaces/Auth/AuthProvidersForm/AuthProvidersForm.utils'
import { describe, expect, it } from 'vitest'

describe('AuthProvidersForm.utils', () => {
  describe('normalizeEscapedNewlines', () => {
    it('converts escaped newlines to real newline characters', () => {
      expect(normalizeEscapedNewlines('Line 1\\nLine 2')).toBe('Line 1\nLine 2')
    })

    it('preserves existing newline characters', () => {
      expect(normalizeEscapedNewlines('Line 1\nLine 2')).toBe('Line 1\nLine 2')
    })

    it('returns non-string values unchanged', () => {
      expect(normalizeEscapedNewlines(null)).toBeNull()
      expect(normalizeEscapedNewlines(false)).toBe(false)
      expect(normalizeEscapedNewlines(123)).toBe(123)
    })
  })

  describe('normalizeSmsTemplateValue', () => {
    it('normalizes only SMS_TEMPLATE field values', () => {
      expect(normalizeSmsTemplateValue(SMS_TEMPLATE_KEY, 'a\\nb')).toBe('a\nb')
      expect(normalizeSmsTemplateValue('OTHER_FIELD', 'a\\nb')).toBe('a\\nb')
    })
  })
})
