import { expect, test, describe } from 'vitest'
import { sanitizeProviderFormPayload } from './ProviderForm.utils'

describe('sanitizeProviderFormPayload', () => {
  test('should replace literal \\n with actual newline in SMS_TEMPLATE', () => {
    const payload = {
      SMS_TEMPLATE: 'Your code is 1234.\\nHave a nice day!'
    }
    const result = sanitizeProviderFormPayload(payload)
    expect(result.SMS_TEMPLATE).toBe('Your code is 1234.\nHave a nice day!')
  })

  test('should leave actual newlines intact', () => {
    const payload = {
      SMS_TEMPLATE: 'Your code is 1234.\nHave a nice day!'
    }
    const result = sanitizeProviderFormPayload(payload)
    expect(result.SMS_TEMPLATE).toBe('Your code is 1234.\nHave a nice day!')
  })

  test('should not throw on non-string SMS_TEMPLATE', () => {
    const payload = {
      SMS_TEMPLATE: null
    }
    const result = sanitizeProviderFormPayload(payload)
    expect(result.SMS_TEMPLATE).toBeNull()

    const payload2 = {
      SMS_TEMPLATE: 12345
    }
    const result2 = sanitizeProviderFormPayload(payload2)
    expect(result2.SMS_TEMPLATE).toBe(12345)
  })

  test('should not modify other fields', () => {
    const payload = {
      SMS_TEMPLATE: 'Line 1\\nLine 2',
      OTHER_FIELD: 'Literal \\n should stay'
    }
    const result = sanitizeProviderFormPayload(payload)
    expect(result.SMS_TEMPLATE).toBe('Line 1\nLine 2')
    expect(result.OTHER_FIELD).toBe('Literal \\n should stay')
  })
})
