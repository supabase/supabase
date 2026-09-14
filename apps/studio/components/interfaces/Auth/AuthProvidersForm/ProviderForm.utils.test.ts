import { describe, expect, it } from 'vitest'

import { decodeSmsTemplateNewlines, encodeSmsTemplateNewlines } from './ProviderForm.utils'

describe('encodeSmsTemplateNewlines', () => {
  it('converts escaped newlines into real newline characters', () => {
    const input = 'Your OTP: {{ .Code }}\\nFor @example.com #{{ .Code }}'
    const expected = 'Your OTP: {{ .Code }}\nFor @example.com #{{ .Code }}'
    expect(encodeSmsTemplateNewlines(input)).toBe(expected)
  })

  it('converts multiple escaped newlines', () => {
    expect(encodeSmsTemplateNewlines('a\\nb\\nc')).toBe('a\nb\nc')
  })

  it('leaves a template without escape sequences unchanged', () => {
    expect(encodeSmsTemplateNewlines('Your OTP: {{ .Code }}')).toBe('Your OTP: {{ .Code }}')
  })

  it('handles an empty string', () => {
    expect(encodeSmsTemplateNewlines('')).toBe('')
  })
})

describe('decodeSmsTemplateNewlines', () => {
  it('converts real newline characters into escaped newlines', () => {
    const input = 'Your OTP: {{ .Code }}\nFor @example.com #{{ .Code }}'
    const expected = 'Your OTP: {{ .Code }}\\nFor @example.com #{{ .Code }}'
    expect(decodeSmsTemplateNewlines(input)).toBe(expected)
  })

  it('leaves a single-line template unchanged', () => {
    expect(decodeSmsTemplateNewlines('Your OTP: {{ .Code }}')).toBe('Your OTP: {{ .Code }}')
  })

  it('handles an empty string', () => {
    expect(decodeSmsTemplateNewlines('')).toBe('')
  })
})

describe('SMS template newline round-trip', () => {
  it('returns the original typed value after encode then decode', () => {
    const typed = 'Your OTP: {{ .Code }}\\nFor @example.com #{{ .Code }}'
    expect(decodeSmsTemplateNewlines(encodeSmsTemplateNewlines(typed))).toBe(typed)
  })

  it('returns the original stored value after decode then encode', () => {
    const stored = 'Your OTP: {{ .Code }}\nFor @example.com #{{ .Code }}'
    expect(encodeSmsTemplateNewlines(decodeSmsTemplateNewlines(stored))).toBe(stored)
  })
})
