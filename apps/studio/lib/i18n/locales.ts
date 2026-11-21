import * as z from 'zod'

export const LOCALES = ['en', 'ja'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Each language is named in itself, so people can find theirs whichever language is active. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
}

const localeSchema = z.enum(LOCALES).catch(DEFAULT_LOCALE)

/** Parses an untrusted value (e.g. read from localStorage). Anything unsupported becomes English. */
export const parseLocale = (value: unknown): Locale => localeSchema.parse(value)
