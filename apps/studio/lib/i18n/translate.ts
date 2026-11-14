import { DEFAULT_LOCALE, type Locale } from './locales'
import { en, type MessageKey } from './messages/en'
import { ja } from './messages/ja'

export type MessageParams = Record<string, string | number>

type Catalogs = Record<Locale, Partial<Record<MessageKey, string>>>

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g

/** Names of the `{placeholders}` in a message, in order of appearance. */
export const getPlaceholders = (message: string): string[] =>
  Array.from(message.matchAll(PLACEHOLDER_PATTERN), (match) => match[1])

/** Fills `{placeholders}` from `params`. A placeholder with no matching param is left as written. */
export const interpolate = (message: string, params?: MessageParams): string => {
  if (!params) return message
  return message.replace(PLACEHOLDER_PATTERN, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder
  )
}

/**
 * Resolves a message and its actual language together, including English fallback.
 * A missing message falls back to the key itself rather than rendering blank text.
 */
export const createResolveMessage =
  (catalogs: Catalogs) =>
  (locale: Locale, key: MessageKey, params?: MessageParams): { text: string; lang: Locale } => {
    const message = catalogs[locale][key]
    return {
      text: interpolate(message ?? catalogs[DEFAULT_LOCALE][key] ?? key, params),
      lang: message === undefined ? DEFAULT_LOCALE : locale,
    }
  }

export const createTranslate = (catalogs: Catalogs) => {
  const resolve = createResolveMessage(catalogs)
  return (locale: Locale, key: MessageKey, params?: MessageParams): string =>
    resolve(locale, key, params).text
}

const catalogs = { en, ja }
export const resolveMessage = createResolveMessage(catalogs)
export const translate = createTranslate(catalogs)
