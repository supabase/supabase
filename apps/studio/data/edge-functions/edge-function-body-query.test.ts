import { describe, expect, it } from 'vitest'

import { isFunctionBodyMaxSizeError } from './edge-function-body-query'

describe('isFunctionBodyMaxSizeError', () => {
  it('is true for a 507 error', () => {
    expect(isFunctionBodyMaxSizeError({ code: 507 })).toBe(true)
  })

  it('is false for other status codes', () => {
    expect(isFunctionBodyMaxSizeError({ code: 500 })).toBe(false)
    expect(isFunctionBodyMaxSizeError({})).toBe(false)
  })

  it('is false when there is no error', () => {
    expect(isFunctionBodyMaxSizeError(null)).toBe(false)
    expect(isFunctionBodyMaxSizeError(undefined)).toBe(false)
  })
})
