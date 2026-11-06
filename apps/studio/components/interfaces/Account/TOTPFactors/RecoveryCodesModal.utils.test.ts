import { describe, expect, test } from 'vitest'

import { formatRecoveryCode } from './RecoveryCodesModal.utils'

describe('formatRecoveryCode', () => {
  test('transforms a backend code to a human readable format', () => {
    expect(formatRecoveryCode('p6pcl32vl6q6l6nt')).toEqual('P6PC-L32V-L6Q6-L6NT')
  })
  test('returns the code unchanged if it does not match the expected format', () => {
    expect(formatRecoveryCode('bazinga')).toEqual('bazinga')
  })
})
