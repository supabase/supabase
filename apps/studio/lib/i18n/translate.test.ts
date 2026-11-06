import { describe, expect, it } from 'vitest'

import { createTranslate, getPlaceholders, interpolate, translate } from './translate'

describe('getPlaceholders', () => {
  it('lists placeholder names in order of appearance', () => {
    expect(getPlaceholders('Hello {first} {last}')).toStrictEqual(['first', 'last'])
  })

  it('keeps repeated placeholders', () => {
    expect(getPlaceholders('{a} and {a}')).toStrictEqual(['a', 'a'])
  })

  it('returns an empty list when there are none', () => {
    expect(getPlaceholders('Nothing to fill in')).toStrictEqual([])
  })

  it('ignores braces that are not a simple placeholder', () => {
    expect(getPlaceholders('{} { spaced } {with-dash}')).toStrictEqual([])
  })
})

describe('interpolate', () => {
  it('returns the message untouched when there are no params', () => {
    expect(interpolate('Hello {name}')).toBe('Hello {name}')
  })

  it('replaces every occurrence of a placeholder', () => {
    expect(interpolate('{a} + {a}', { a: 'x' })).toBe('x + x')
  })

  it('accepts numbers', () => {
    expect(interpolate('{count} items', { count: 3 })).toBe('3 items')
    expect(interpolate('{count} items', { count: 0 })).toBe('0 items')
  })

  it('leaves a placeholder without a matching param as written', () => {
    expect(interpolate('Hello {name}', { other: 'x' })).toBe('Hello {name}')
  })

  it('ignores params that the message does not use', () => {
    expect(interpolate('Hello', { name: 'x' })).toBe('Hello')
  })

  it('does not treat inherited object properties as params', () => {
    expect(interpolate('{constructor} {toString}', {})).toBe('{constructor} {toString}')
  })

  it('does not interpolate inside substituted values', () => {
    expect(interpolate('{a}', { a: '{b}', b: 'x' })).toBe('{b}')
  })
})

describe('createTranslate', () => {
  const title = 'account.preferences.title'
  const languageTitle = 'account.preferences.language.title'

  const translateWith = createTranslate({
    en: { [title]: 'Preferences', [languageTitle]: 'Language' },
    ja: { [title]: '環境設定' },
  })

  it('uses the requested locale when it has the key', () => {
    expect(translateWith('ja', title)).toBe('環境設定')
    expect(translateWith('en', title)).toBe('Preferences')
  })

  it('falls back to English when the locale has no translation', () => {
    expect(translateWith('ja', languageTitle)).toBe('Language')
  })

  it('falls back to the key itself when no catalog has it', () => {
    const translateEmpty = createTranslate({ en: {}, ja: {} })
    expect(translateEmpty('ja', title)).toBe(title)
  })

  it('fills placeholders after picking the message', () => {
    const translateParams = createTranslate({
      en: { 'account.preferences.timezone.autoDetectWithZone': 'Auto detect ({timezone})' },
      ja: {},
    })
    expect(
      translateParams('ja', 'account.preferences.timezone.autoDetectWithZone', {
        timezone: 'Asia/Tokyo',
      })
    ).toBe('Auto detect (Asia/Tokyo)')
  })
})

describe('translate', () => {
  it('renders English', () => {
    expect(translate('en', 'account.preferences.title')).toBe('Preferences')
  })

  it('renders Japanese', () => {
    expect(translate('ja', 'account.preferences.title')).toBe('環境設定')
  })

  it('fills placeholders in both languages', () => {
    const params = { timezone: 'Asia/Tokyo' }
    expect(translate('en', 'account.preferences.timezone.autoDetectWithZone', params)).toBe(
      'Auto detect (Asia/Tokyo)'
    )
    expect(translate('ja', 'account.preferences.timezone.autoDetectWithZone', params)).toBe(
      '自動検出（Asia/Tokyo）'
    )
  })
})
