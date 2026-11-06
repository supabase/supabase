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
 * Builds a `translate` function over the given catalogs. It looks a key up in the requested
 * locale, then in the default locale, then falls back to the key itself, so a missing
 * translation never renders as blank text.
 */
export const createTranslate =
  (catalogs: Catalogs) =>
  (locale: Locale, key: MessageKey, params?: MessageParams): string =>
    interpolate(catalogs[locale][key] ?? catalogs[DEFAULT_LOCALE][key] ?? key, params)

export const translate = createTranslate({ en, ja })
