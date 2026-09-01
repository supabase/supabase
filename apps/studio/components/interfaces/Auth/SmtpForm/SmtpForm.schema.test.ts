import { describe, expect, it } from 'vitest'

import { smtpEnabledSchema, smtpUserSchema } from './SmtpForm.schema'

const validFormValues = {
  ENABLE_SMTP: true as const,
  SMTP_ADMIN_EMAIL: 'noreply@yourdomain.com',
  SMTP_SENDER_NAME: 'Your Name',
  SMTP_HOST: 'smtp.azure.communication.azure.com',
  SMTP_PORT: 587,
  SMTP_MAX_FREQUENCY: 60,
  SMTP_USER: 'smtp-user',
  SMTP_PASS: 'password',
}

describe('smtpUserSchema', () => {
  it('accepts a standard username', () => {
    expect(smtpUserSchema.safeParse('smtp-user').success).toBe(true)
  })

  it('accepts an Azure Communication Services dot-delimited username', () => {
    expect(
      smtpUserSchema.safeParse(
        'my-acs-resource.12345678-90ab-cdef-1234-567890abcdef.87654321-cba0-fedc-4321-fedcba987654'
      ).success
    ).toBe(true)
  })

  it('accepts an Azure Communication Services pipe-delimited username', () => {
    expect(
      smtpUserSchema.safeParse(
        'my-acs-resource|12345678-90ab-cdef-1234-567890abcdef|87654321-cba0-fedc-4321-fedcba987654'
      ).success
    ).toBe(true)
  })

  it('accepts usernames with multiple dots or an email address', () => {
    expect(smtpUserSchema.safeParse('apikey:user.name').success).toBe(true)
    expect(smtpUserSchema.safeParse('user@example.com').success).toBe(true)
  })

  it.each(['', '   '])('rejects an empty username of %s', (value) => {
    expect(smtpUserSchema.safeParse(value).success).toBe(false)
  })

  it.each(['my username', 'resource |appId |tenantId'])(
    'rejects a username containing spaces of %s',
    (value) => {
      expect(smtpUserSchema.safeParse(value).success).toBe(false)
    }
  )
})

describe('smtpEnabledSchema', () => {
  it('accepts a complete form with an Azure Communication Services username', () => {
    const result = smtpEnabledSchema.safeParse({
      ...validFormValues,
      SMTP_USER:
        'my-acs-resource.12345678-90ab-cdef-1234-567890abcdef.87654321-cba0-fedc-4321-fedcba987654',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing username', () => {
    const result = smtpEnabledSchema.safeParse({ ...validFormValues, SMTP_USER: '' })

    expect(result.success).toBe(false)
  })

  it('rejects a username with embedded whitespace', () => {
    const result = smtpEnabledSchema.safeParse({
      ...validFormValues,
      SMTP_USER: 'my acs resource|app-id|tenant-id',
    })

    expect(result.success).toBe(false)
  })
})
