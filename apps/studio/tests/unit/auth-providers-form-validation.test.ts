import { PROVIDERS_SCHEMAS } from 'components/interfaces/Auth/AuthProvidersFormValidation'
import { describe, expect, test, vi } from 'vitest'

const appleProvider = PROVIDERS_SCHEMAS.find((provider) => provider.title === 'Apple')

if (!appleProvider?.validationSchema) {
  throw new Error('Apple auth provider schema not found')
}

const appleValidationSchema = appleProvider.validationSchema
const malformedAppleSecret =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJodHRwczovL2V4YW1wbGUuY29tIn0.signature'

describe('AuthProvidersFormValidation: Apple', () => {
  test('allows native Apple client IDs without a secret key', async () => {
    const isValid = await appleValidationSchema.isValid({
      EXTERNAL_APPLE_ENABLED: true,
      EXTERNAL_APPLE_CLIENT_ID: 'com.example.app',
      EXTERNAL_APPLE_SECRET: '',
      EXTERNAL_APPLE_EMAIL_OPTIONAL: false,
    })

    expect(isValid).toBe(true)
  })

  test('rejects malformed non-empty secret keys', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const isValid = await appleValidationSchema.isValid({
      EXTERNAL_APPLE_ENABLED: true,
      EXTERNAL_APPLE_CLIENT_ID: 'com.example.app',
      EXTERNAL_APPLE_SECRET: malformedAppleSecret,
      EXTERNAL_APPLE_EMAIL_OPTIONAL: false,
    })

    expect(isValid).toBe(false)
    consoleLogSpy.mockRestore()
  })
})
