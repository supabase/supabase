import { describe, expect, it } from 'vitest'

import { getRecoveryCodesPreview } from './RecoveryCodesPreview.utils'

describe('getRecoveryCodesPreview', () => {
  it.each(['localhost', '127.0.0.1'])(
    'accepts only supported counts on %s in development',
    (hostname) => {
      expect(getRecoveryCodesPreview({ value: '1', environment: 'development', hostname })).toBe(1)
      expect(getRecoveryCodesPreview({ value: '2', environment: 'development', hostname })).toBe(2)
      expect(
        getRecoveryCodesPreview({ value: 'invalid', environment: 'development', hostname })
      ).toBeUndefined()
    }
  )
  it.each(['0', '1', '2', '3', 'missing', 'healthy', 'backup', 'mfa-off'])(
    'accepts demo state %s',
    (value) => {
      expect(
        getRecoveryCodesPreview({ value, environment: 'development', hostname: 'localhost' })
      ).toBe(Number.isNaN(Number(value)) ? value : Number(value))
    }
  )
  it.each(['production', 'test', undefined])(
    'ignores overrides outside development',
    (environment) => {
      expect(
        getRecoveryCodesPreview({ value: '1', environment, hostname: 'localhost' })
      ).toBeUndefined()
    }
  )
  it('ignores remote hosts and missing values', () => {
    expect(
      getRecoveryCodesPreview({
        value: '2',
        environment: 'development',
        hostname: 'studio.example.com',
      })
    ).toBeUndefined()
    expect(
      getRecoveryCodesPreview({ value: null, environment: 'development', hostname: 'localhost' })
    ).toBeUndefined()
  })
})
