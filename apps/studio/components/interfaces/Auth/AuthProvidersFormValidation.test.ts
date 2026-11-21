import { describe, expect, it } from 'vitest'

import type { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import {
  getPhoneProviderValidationSchema,
  normalizeSmsTemplate,
  PROVIDERS_SCHEMAS,
} from './AuthProvidersFormValidation'

const URL_FIELDS = [
  {
    title: 'Azure',
    values: {
      EXTERNAL_AZURE_ENABLED: true,
      EXTERNAL_AZURE_CLIENT_ID: 'client-id',
      EXTERNAL_AZURE_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_AZURE_URL',
  },
  {
    title: 'GitLab',
    values: {
      EXTERNAL_GITLAB_ENABLED: true,
      EXTERNAL_GITLAB_CLIENT_ID: 'client-id',
      EXTERNAL_GITLAB_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_GITLAB_URL',
  },
  {
    title: 'KeyCloak',
    values: {
      EXTERNAL_KEYCLOAK_ENABLED: true,
      EXTERNAL_KEYCLOAK_CLIENT_ID: 'client-id',
      EXTERNAL_KEYCLOAK_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_KEYCLOAK_URL',
  },
  {
    title: 'WorkOS',
    values: {
      EXTERNAL_WORKOS_ENABLED: true,
      EXTERNAL_WORKOS_CLIENT_ID: 'client-id',
      EXTERNAL_WORKOS_SECRET: 'secret',
    },
    urlKey: 'EXTERNAL_WORKOS_URL',
  },
  {
    title: 'SAML 2.0',
    values: { SAML_ENABLED: true },
    urlKey: 'SAML_EXTERNAL_URL',
  },
]

const getValidationSchema = (title: string) => {
  const schema = PROVIDERS_SCHEMAS.find((provider) => provider.title === title)?.validationSchema
  if (!schema) {
    throw new Error(`No validation schema for ${title}`)
  }

  return schema
}

describe('AuthProvidersFormValidation: provider URL fields', () => {
  it.each(URL_FIELDS)('$title trims surrounding whitespace from the URL', (field) => {
    const result = getValidationSchema(field.title).safeParse({
      ...field.values,
      [field.urlKey]: '  https://auth.example.com/realms/main  ',
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ [field.urlKey]: 'https://auth.example.com/realms/main' })
  })

  it.each(URL_FIELDS)('$title rejects a URL with an interior space', (field) => {
    const result = getValidationSchema(field.title).safeParse({
      ...field.values,
      [field.urlKey]: 'https://auth.example.com/realms/my realm',
    })

    expect(result.success).toBe(false)
  })
})

describe('AuthProvidersFormValidation: normalizeSmsTemplate', () => {
  it('converts literal \\n escape sequences into real newlines', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\\n@example.com #123456')).toBe(
      'Your code is {{ .Code }}\n@example.com #123456'
    )
  })

  it('converts literal \\r\\n escape sequences into real newlines', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\\r\\n@example.com #123456')).toBe(
      'Your code is {{ .Code }}\n@example.com #123456'
    )
  })

  it('preserves existing real newlines', () => {
    expect(normalizeSmsTemplate('Your code is {{ .Code }}\n@example.com #123456')).toBe(
      'Your code is {{ .Code }}\n@example.com #123456'
    )
  })

  it('preserves \\n escape sequences inside Go template {{ ... }} actions while converting plain-text \\n', () => {
    expect(
      normalizeSmsTemplate('Your code is {{ printf "%s\\n" .Code }}\\n@example.com #123456')
    ).toBe('Your code is {{ printf "%s\\n" .Code }}\n@example.com #123456')
  })

  it('passes through non-string values safely', () => {
    expect(normalizeSmsTemplate(undefined)).toBeUndefined()
    expect(normalizeSmsTemplate(null)).toBeNull()
  })
})

describe('AuthProvidersFormValidation: Phone provider SMS_TEMPLATE', () => {
  const phoneSchema = getPhoneProviderValidationSchema({
    HOOK_SEND_SMS_ENABLED: false,
  } as unknown as ProjectAuthConfigData)

  const basePhoneValues = {
    EXTERNAL_PHONE_ENABLED: true,
    SMS_PROVIDER: 'twilio',
    SMS_TWILIO_ACCOUNT_SID: 'AC1234567890',
    SMS_TWILIO_AUTH_TOKEN: 'auth-token',
    SMS_TWILIO_MESSAGE_SERVICE_SID: 'MG1234567890',
    SMS_OTP_EXP: 60,
    SMS_OTP_LENGTH: 6,
    SMS_TEST_OTP: '',
  }

  it('normalizes literal \\n escape sequences into actual newlines in parsed form data', () => {
    const result = phoneSchema.safeParse({
      ...basePhoneValues,
      SMS_TEMPLATE: 'Your code is {{ .Code }}\\n@example.com #123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).SMS_TEMPLATE).toBe(
        'Your code is {{ .Code }}\n@example.com #123456'
      )
    }
  })

  it('normalizes literal \\r\\n escape sequences into actual newlines in parsed form data', () => {
    const result = phoneSchema.safeParse({
      ...basePhoneValues,
      SMS_TEMPLATE: 'Your code is {{ .Code }}\\r\\n@example.com #123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).SMS_TEMPLATE).toBe(
        'Your code is {{ .Code }}\n@example.com #123456'
      )
    }
  })

  it('preserves real newlines entered via multiline textarea in parsed form data', () => {
    const result = phoneSchema.safeParse({
      ...basePhoneValues,
      SMS_TEMPLATE: 'Your code is {{ .Code }}\n@example.com #123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).SMS_TEMPLATE).toBe(
        'Your code is {{ .Code }}\n@example.com #123456'
      )
    }
  })

  it('preserves \\n escape sequences inside Go template {{ ... }} actions while converting plain-text \\n in parsed form data', () => {
    const result = phoneSchema.safeParse({
      ...basePhoneValues,
      SMS_TEMPLATE: 'Your code is {{ printf "%s\\n" .Code }}\\n@example.com #123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).SMS_TEMPLATE).toBe(
        'Your code is {{ printf "%s\\n" .Code }}\n@example.com #123456'
      )
    }
  })
})
