import { describe, it, expect } from 'vitest'
import { lookupMime } from './mime'

describe('lookupMime', () => {
  it('returns the correct mime type for a known extension', () => {
    // 'html' is a common extension in mime-db
    expect(lookupMime('html')).toBe('text/html')
  })

  it('returns undefined for an unknown extension', () => {
    expect(lookupMime('notarealext')).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(lookupMime(undefined)).toBeUndefined()
  })

  it('is case insensitive', () => {
    expect(lookupMime('JPG')).toBe(lookupMime('jpg'))
  })
})
