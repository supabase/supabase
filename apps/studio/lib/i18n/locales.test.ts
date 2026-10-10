import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES, parseLocale } from './locales'

describe('parseLocale', () => {
  it.each(LOCALES)('keeps the supported locale %s', (locale) => {
    expect(parseLocale(locale)).toBe(locale)
  })

  it.each([undefined, null, '', 'fr', 'EN', 'ja-JP', ' ja', 1, true, {}, ['ja']])(
    'falls back to the default locale for %j',
    (value) => {
      expect(parseLocale(value)).toBe(DEFAULT_LOCALE)
    }
  )
})

describe('LOCALE_LABELS', () => {
  it.each(LOCALES)('has a visible label for %s', (locale) => {
    expect(LOCALE_LABELS[locale].trim()).not.toBe('')
  })
})
