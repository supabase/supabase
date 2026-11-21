// Messages.utils.test.ts
import { describe, expect, it } from 'vitest'

import { isUnixMicro, unixMicroToIsoTimestamp } from './Messages.utils'

describe('unixMicroToIsoTimestamp', () => {
  it('converts a 16-digit unix-microsecond timestamp to the correct ISO date', () => {
    // 1700000000000000 micro = 1700000000 sec = 2023-11-14T22:13:20.000Z
    expect(unixMicroToIsoTimestamp('1700000000000000')).toBe('2023-11-14T22:13:20.000Z')
  })
})

describe('isUnixMicro', () => {
  it('accepts 16-digit values', () => {
    expect(isUnixMicro('1700000000000000')).toBe(true)
  })
})
