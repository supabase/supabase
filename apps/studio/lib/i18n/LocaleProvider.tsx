import { LOCAL_STORAGE_KEYS } from 'common'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'

import { DEFAULT_LOCALE, parseLocale, type Locale } from './locales'
import type { MessageKey } from './messages/en'
import { translate, type MessageParams } from './translate'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

interface LocaleContextValue {
  /** The language in use. Always a supported locale. */
  locale: Locale
  /** Saves the language on this device. */
  setLocale: (locale: Locale) => void
  /** Renders a message in the current language, falling back to English. */
  t: (key: MessageKey, params?: MessageParams) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * Holds the dashboard language. The choice is stored in localStorage (like the timezone) and
 * mirrored onto `<html lang>`, so screen readers and the browser (hyphenation, font selection,
 * spell check) treat the page in the right language. A stored value that isn't a supported
 * locale is treated as English.
 */
export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [storedLocale, setStoredLocale] = useLocalStorageQuery<unknown>(
    LOCAL_STORAGE_KEYS.UI_LOCALE,
    DEFAULT_LOCALE
  )
  const locale = parseLocale(storedLocale)

  useEffect(() => {
    const previousLang = document.documentElement.lang
    document.documentElement.lang = locale

    return () => {
      document.documentElement.lang = previousLang
    }
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setStoredLocale(nextLocale),
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setStoredLocale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

// Used outside a provider (isolated component tests, stories): English, and choosing a language
// does nothing. A stable object, so such callers don't get a new one on every render.
const FALLBACK_VALUE: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
}

/**
 * The dashboard language and a `t()` that renders messages in it. Works without a provider, in
 * which case everything is English, so components can adopt `t()` without every test that
 * renders them needing a wrapper.
 */
export const useTranslation = (): LocaleContextValue => useContext(LocaleContext) ?? FALLBACK_VALUE
