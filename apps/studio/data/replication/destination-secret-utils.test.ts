import { describe, expect, it } from 'vitest'

import { optionalSecret } from './destination-secret-utils'

describe('optionalSecret', () => {
  it('omits blank secret values', () => {
    expect(optionalSecret('')).toBeUndefined()
    expect(optionalSecret('  ')).toBeUndefined()
    expect(optionalSecret(undefined)).toBeUndefined()
  })

  it('omits masked placeholder values even when shortened', () => {
    expect(optionalSecret('••••••••••••••••')).toBeUndefined()
    expect(optionalSecret('••••••••')).toBeUndefined()
    expect(optionalSecret('  ••••••  ')).toBeUndefined()
  })

  it('keeps provided replacement secrets', () => {
    expect(optionalSecret('new-secret')).toBe('new-secret')
  })
})
