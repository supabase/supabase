import { describe, expect, it } from 'vitest'

import { getPhoneProviderValidationSchema } from './AuthProvidersFormValidation'
import type { ProjectAuthConfigData } from '@/data/auth/auth-config-query'

function createPhoneAuthConfig(
  overrides: Partial<ProjectAuthConfigData> = {}
): ProjectAuthConfigData {
  return {
    DISABLE_SIGNUP: false,
    EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
    SECURITY_MANUAL_LINKING_ENABLED: false,
    MAILER_AUTOCONFIRM: false,
    SITE_URL: 'http://localhost:3000',
    SECURITY_CAPTCHA_ENABLED: false,
    EXTERNAL_EMAIL_ENABLED: true,
    MAILER_OTP_EXP: 300,
    HOOK_SEND_SMS_ENABLED: false,
    EXTERNAL_PHONE_ENABLED: false,
    SMS_PROVIDER: '',
    SMS_AUTOCONFIRM: false,
    SMS_OTP_EXP: 300,
    SMS_OTP_LENGTH: 6,
    SMS_TEMPLATE: 'Your code is {{ .Code }}',
    SMS_TEST_OTP: '18005550123=789012',
    SMS_TEST_OTP_VALID_UNTIL: '2030-01-01T00:00:00.000Z',
    SMS_TWILIO_ACCOUNT_SID: null,
    SMS_TWILIO_AUTH_TOKEN: null,
    SMS_TWILIO_MESSAGE_SERVICE_SID: null,
    ...overrides,
  } as ProjectAuthConfigData
}

describe('getPhoneProviderValidationSchema', () => {
  it('keeps EXTERNAL_PHONE_ENABLED in the parsed payload for enabled phone providers', () => {
    const schema = getPhoneProviderValidationSchema(createPhoneAuthConfig())

    const parsed = schema.parse({
      EXTERNAL_PHONE_ENABLED: true,
      SMS_PROVIDER: 'twilio',
      SMS_AUTOCONFIRM: true,
      SMS_OTP_EXP: 300,
      SMS_OTP_LENGTH: 6,
      SMS_TEMPLATE: 'Your code is {{ .Code }}',
      SMS_TEST_OTP: '18005550123=789012',
      SMS_TEST_OTP_VALID_UNTIL: '2030-01-01T00:00:00.000Z',
      SMS_TWILIO_ACCOUNT_SID: 'AC123456789',
      SMS_TWILIO_AUTH_TOKEN: 'auth-token',
      SMS_TWILIO_MESSAGE_SERVICE_SID: 'MG123456789',
    })

    expect(parsed).toMatchObject({
      EXTERNAL_PHONE_ENABLED: true,
      SMS_PROVIDER: 'twilio',
      SMS_OTP_EXP: 300,
      SMS_OTP_LENGTH: 6,
      SMS_TEMPLATE: 'Your code is {{ .Code }}',
      SMS_TEST_OTP: '18005550123=789012',
      SMS_TEST_OTP_VALID_UNTIL: '2030-01-01T00:00:00.000Z',
      SMS_TWILIO_ACCOUNT_SID: 'AC123456789',
      SMS_TWILIO_AUTH_TOKEN: 'auth-token',
      SMS_TWILIO_MESSAGE_SERVICE_SID: 'MG123456789',
    })
  })
})
