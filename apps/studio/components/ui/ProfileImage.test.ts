import { describe, expect, it } from 'vitest'

import { getSafeProfileImageSrc } from './ProfileImage'

describe('getSafeProfileImageSrc', () => {
  it('returns original string for valid sources', () => {
    expect(getSafeProfileImageSrc('https://example.com/avatar.png')).toBe(
      'https://example.com/avatar.png'
    )
  })

  it('trims source and rejects empty strings', () => {
    expect(getSafeProfileImageSrc('   /avatar.png  ')).toBe('/avatar.png')
    expect(getSafeProfileImageSrc('')).toBeUndefined()
    expect(getSafeProfileImageSrc('   ')).toBeUndefined()
  })

  it('rejects non-string values', () => {
    expect(getSafeProfileImageSrc(undefined)).toBeUndefined()
    expect(getSafeProfileImageSrc(null)).toBeUndefined()
    expect(getSafeProfileImageSrc({ src: '/avatar.png' })).toBeUndefined()
    expect(getSafeProfileImageSrc(123)).toBeUndefined()
  })
})
