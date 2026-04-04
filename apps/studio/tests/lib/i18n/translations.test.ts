import { describe, test, expect } from 'vitest'
import { t, translations, LANGUAGES, type LangCode } from 'lib/i18n/translations'

// ─── t() function ─────────────────────────────────────────
describe('t() translation function', () => {
  test('returns French translation for known key', () => {
    expect(t('fr', 'dashboard')).toBe('Tableau de bord')
  })

  test('returns English translation for known key', () => {
    expect(t('en', 'dashboard')).toBe('Dashboard')
  })

  test('returns Italian translation for known key', () => {
    expect(t('it', 'dashboard')).toBe('Pannello')
  })

  test('returns Spanish translation for known key', () => {
    expect(t('es', 'dashboard')).toBe('Panel')
  })

  test('falls back to English for unknown language', () => {
    // @ts-expect-error - testing invalid language code
    const result = t('xx', 'dashboard')
    expect(result).toBe('Dashboard')
  })

  test('falls back to key name when key not found in any language', () => {
    // @ts-expect-error - testing invalid key
    const result = t('en', 'nonExistentKey')
    expect(result).toBe('nonExistentKey')
  })

  test('returns different text for different languages', () => {
    const fr = t('fr', 'enter')
    const en = t('en', 'enter')
    expect(fr).not.toBe(en)
  })
})

// ─── LANGUAGES constant ──────────────────────────────────
describe('LANGUAGES constant', () => {
  test('contains French', () => {
    expect(LANGUAGES.fr).toBe('Francais')
  })

  test('contains English', () => {
    expect(LANGUAGES.en).toBe('English')
  })

  test('has at least 10 languages', () => {
    expect(Object.keys(LANGUAGES).length).toBeGreaterThanOrEqual(10)
  })
})

// ─── Translations completeness ───────────────────────────
describe('translations completeness', () => {
  const englishKeys = Object.keys(translations.en) as (keyof typeof translations.en)[]

  test('French has all English keys', () => {
    for (const key of englishKeys) {
      expect(translations.fr[key], `Missing FR key: ${key}`).toBeDefined()
    }
  })

  test('all languages have the same number of keys as English', () => {
    const enCount = englishKeys.length
    for (const [langCode, langTranslations] of Object.entries(translations)) {
      const langCount = Object.keys(langTranslations).length
      expect(langCount, `Language ${langCode} has ${langCount} keys, expected ${enCount}`).toBe(enCount)
    }
  })

  test('no translation value is empty string', () => {
    for (const [langCode, langTranslations] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(langTranslations)) {
        expect(value, `Empty value: ${langCode}.${key}`).not.toBe('')
      }
    }
  })
})
