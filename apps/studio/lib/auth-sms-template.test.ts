import { describe, expect, it } from 'vitest'

import {
  isSmsTemplateConfigKey,
  normalizeSmsTemplateFieldsInPayload,
  normalizeSmsTemplateNewlines,
  readSmsTemplateFromConfig,
  SMS_TEMPLATE_CONFIG_KEYS,
} from './auth-sms-template'

describe('isSmsTemplateConfigKey', () => {
  it('identifies known SMS template config keys', () => {
    expect(isSmsTemplateConfigKey('SMS_TEMPLATE')).toBe(true)
    expect(isSmsTemplateConfigKey('MFA_PHONE_TEMPLATE')).toBe(true)
  })

  it('rejects unrelated config keys', () => {
    expect(isSmsTemplateConfigKey('SMS_OTP_LENGTH')).toBe(false)
    expect(isSmsTemplateConfigKey('OTHER_FIELD')).toBe(false)
  })
})

describe('normalizeSmsTemplateNewlines', () => {
  it('returns empty string for null, undefined, and empty input', () => {
    expect(normalizeSmsTemplateNewlines(null)).toBe('')
    expect(normalizeSmsTemplateNewlines(undefined)).toBe('')
    expect(normalizeSmsTemplateNewlines('')).toBe('')
  })

  it('converts literal \\n to newlines', () => {
    expect(normalizeSmsTemplateNewlines('{{ .Code }}\\n@example.com #{{ .Code }}')).toBe(
      '{{ .Code }}\n@example.com #{{ .Code }}'
    )
  })

  it('converts literal \\r\\n to newlines', () => {
    expect(normalizeSmsTemplateNewlines('{{ .Code }}\\r\\n@example.com')).toBe(
      '{{ .Code }}\n@example.com'
    )
  })

  it('converts multiple literal \\n sequences', () => {
    expect(normalizeSmsTemplateNewlines('a\\nb\\nc')).toBe('a\nb\nc')
  })

  it('leaves templates unchanged when they only contain real newlines', () => {
    const template = '{{ .Code }}\n@example.com #{{ .Code }}'
    expect(normalizeSmsTemplateNewlines(template)).toBe(template)
  })

  it('converts literal \\n even when real newlines are already present', () => {
    expect(normalizeSmsTemplateNewlines('line1\nline2\\nline3')).toBe('line1\nline2\nline3')
  })

  it('is idempotent', () => {
    const once = normalizeSmsTemplateNewlines('{{ .Code }}\\n@example.com')
    const twice = normalizeSmsTemplateNewlines(once)
    expect(twice).toBe('{{ .Code }}\n@example.com')
    expect(twice).toBe(once)
  })

  it('does not modify templates without escape sequences', () => {
    expect(normalizeSmsTemplateNewlines('Your code is {{ .Code }}')).toBe(
      'Your code is {{ .Code }}'
    )
  })

  it('supports common WebOTP-style formatting', () => {
    const input = 'Your code is {{ .Code }}\\n@myapp.com #{{ .Code }}'
    const expected = 'Your code is {{ .Code }}\n@myapp.com #{{ .Code }}'
    expect(normalizeSmsTemplateNewlines(input)).toBe(expected)
  })
})

describe('readSmsTemplateFromConfig', () => {
  it('normalizes stored templates', () => {
    expect(readSmsTemplateFromConfig('code\\n@app.com')).toBe('code\n@app.com')
  })

  it('uses the fallback when the config value is nullish', () => {
    expect(readSmsTemplateFromConfig(null, 'Your code is {{ .Code }}')).toBe(
      'Your code is {{ .Code }}'
    )
    expect(readSmsTemplateFromConfig(undefined, 'fallback\\nline')).toBe('fallback\nline')
  })
})

describe('normalizeSmsTemplateFieldsInPayload', () => {
  it('normalizes known SMS template keys only', () => {
    expect(SMS_TEMPLATE_CONFIG_KEYS).toEqual(['SMS_TEMPLATE', 'MFA_PHONE_TEMPLATE'])

    const payload = {
      SMS_TEMPLATE: 'otp\\n@app.com',
      MFA_PHONE_TEMPLATE: 'code\\r\\n@app.com',
      SMS_OTP_LENGTH: 6,
      OTHER_FIELD: 'keep\\nme',
    }

    expect(normalizeSmsTemplateFieldsInPayload(payload)).toEqual({
      SMS_TEMPLATE: 'otp\n@app.com',
      MFA_PHONE_TEMPLATE: 'code\n@app.com',
      SMS_OTP_LENGTH: 6,
      OTHER_FIELD: 'keep\\nme',
    })
  })

  it('does not mutate the original payload object', () => {
    const payload = { SMS_TEMPLATE: 'a\\nb' }
    const normalized = normalizeSmsTemplateFieldsInPayload(payload)

    expect(normalized).toEqual({ SMS_TEMPLATE: 'a\nb' })
    expect(payload).toEqual({ SMS_TEMPLATE: 'a\\nb' })
    expect(normalized).not.toBe(payload)
  })

  it('ignores non-string template values', () => {
    const payload = { SMS_TEMPLATE: null, MFA_PHONE_TEMPLATE: undefined }
    expect(normalizeSmsTemplateFieldsInPayload(payload)).toEqual(payload)
  })
})
