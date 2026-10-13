import { describe, expect, it } from 'vitest'

import { getRecoveryCodesPreview } from './RecoveryCodesPreview.utils'

describe('getRecoveryCodesPreview', () => {
  it.each(['localhost', '127.0.0.1'])(
    'accepts only supported counts on %s in development',
    (hostname) => {
      expect(getRecoveryCodesPreview({ value: '1', environment: 'development', hostname })).toBe(1)
      expect(getRecoveryCodesPreview({ value: '2', environment: 'development', hostname })).toBe(2)
      expect(
        getRecoveryCodesPreview({ value: '0', environment: 'development', hostname })
      ).toBeUndefined()
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
