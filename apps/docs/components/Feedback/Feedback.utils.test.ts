import { describe, expect, it } from 'vitest'

import { sanitizeTabParams, toSafePathname } from './Feedback.utils'

describe('sanitizeTabParams', () => {
  it('keeps only params named in queryGroups', () => {
    expect(sanitizeTabParams('?q=secret&queryGroups=language&language=js')).toEqual({
      language: 'js',
    })
  })

  it('keeps several query groups', () => {
    expect(
      sanitizeTabParams('?queryGroups=language&queryGroups=framework&language=js&framework=nextjs')
    ).toEqual({ language: 'js', framework: 'nextjs' })
  })

  it('accepts camelCase group names', () => {
    expect(sanitizeTabParams('?queryGroups=solanaWallet&solanaWallet=phantom')).toEqual({
      solanaWallet: 'phantom',
    })
  })

  it('drops a token-like value that fails the slug pattern', () => {
    expect(
      sanitizeTabParams(
        '?queryGroups=token&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0'
      )
    ).toEqual({})
  })

  it('keeps real mixed-case and spaced tab ids', () => {
    expect(
      sanitizeTabParams('?queryGroups=database&queryGroups=method&database=MS%20SQL&method=POST')
    ).toEqual({ database: 'MS SQL', method: 'POST' })
  })

  it('drops values with dots, @ or slashes', () => {
    expect(
      sanitizeTabParams(
        '?queryGroups=a&queryGroups=b&queryGroups=c&a=a.b&b=me%40example.com&c=https%3A%2F%2Fx'
      )
    ).toEqual({})
  })

  it('drops sb_-prefixed Supabase keys in any case', () => {
    expect(
      sanitizeTabParams(
        '?queryGroups=a&queryGroups=b&queryGroups=c&a=sb_publishable_abc123&b=SB_secret_x&c=sbx'
      )
    ).toEqual({ c: 'sbx' })
  })

  it('drops values over 64 characters', () => {
    expect(sanitizeTabParams(`?queryGroups=language&language=${'a'.repeat(65)}`)).toEqual({})
    expect(sanitizeTabParams(`?queryGroups=language&language=${'a'.repeat(64)}`)).toEqual({
      language: 'a'.repeat(64),
    })
  })

  it('drops group names that are not slugs', () => {
    expect(sanitizeTabParams(`?queryGroups=${'k'.repeat(41)}&${'k'.repeat(41)}=js`)).toEqual({})
    expect(sanitizeTabParams('?queryGroups=a.b&a.b=js')).toEqual({})
  })

  it('drops groups with no matching param or an empty value', () => {
    expect(sanitizeTabParams('?queryGroups=language&queryGroups=platform&platform=')).toEqual({})
  })

  it('caps the result at 10 keys', () => {
    const keys = Array.from({ length: 12 }, (_, index) => `g${index}`)
    const search = keys.map((key) => `queryGroups=${key}&${key}=v`).join('&')

    expect(Object.keys(sanitizeTabParams(`?${search}`))).toEqual(keys.slice(0, 10))
  })

  it('returns an empty object for an empty search string', () => {
    expect(sanitizeTabParams('')).toEqual({})
  })
})

describe('toSafePathname', () => {
  it('strips the query string and hash', () => {
    expect(toSafePathname('/guides/auth?q=secret&queryGroups=language&language=js')).toBe(
      '/guides/auth'
    )
    expect(toSafePathname('/guides/auth#token=abc')).toBe('/guides/auth')
  })

  it('caps the pathname at 256 characters', () => {
    expect(toSafePathname(`/${'a'.repeat(300)}`)).toHaveLength(256)
  })
})
