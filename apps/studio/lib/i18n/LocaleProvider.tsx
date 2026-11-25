import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { DEFAULT_LOCALE, parseLocale, type Locale } from './locales'
import type { MessageKey } from './messages/en'
import { translate, type MessageParams } from './translate'
import { getLocalStorageQueryKey } from '@/hooks/misc/useLocalStorage'

interface LocaleContextValue {
  /** The language in use. Always a supported locale. */
  locale: Locale
  /** Saves the language on this device and reports whether the change was persisted. */
  setLocale: (locale: Locale) => boolean
  /** Renders a message in the current language, falling back to English. */
  t: (key: MessageKey, params?: MessageParams) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)
const localeStorageKey = LOCAL_STORAGE_KEYS.UI_LOCALE
const localeQueryKey = getLocalStorageQueryKey(localeStorageKey)

const readStoredLocale = (): Locale => {
  const stored = safeLocalStorage.getItem(localeStorageKey)
  if (stored === null) return DEFAULT_LOCALE

  try {
    return parseLocale(JSON.parse(stored))
  } catch {
    return DEFAULT_LOCALE
  }
}

/**
 * Holds the preferred language for translated messages and saves it in localStorage.
 * The document stays in English while most of Studio is untranslated; translated content
 * declares its own language. A stored value that isn't supported is treated as English.
 */
export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const { data: locale = DEFAULT_LOCALE } = useQuery({
    queryKey: localeQueryKey,
    queryFn: readStoredLocale,
  })

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        const nextValue = JSON.stringify(nextLocale)
        safeLocalStorage.setItem(localeStorageKey, nextValue)

        // The safe adapter handles storage exceptions. Update the UI only after persistence.
        if (safeLocalStorage.getItem(localeStorageKey) !== nextValue) return false

        queryClient.setQueryData(localeQueryKey, nextLocale)
        return true
      },
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, queryClient]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

// Used outside a provider (isolated component tests, stories): English, and choosing a language
// does nothing. A stable object, so such callers don't get a new one on every render.
const FALLBACK_VALUE: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => false,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
}

/**
 * The dashboard language and a `t()` that renders messages in it. Works without a provider, in
 * which case everything is English, so components can adopt `t()` without every test that
 * renders them needing a wrapper.
 */
export const useTranslation = (): LocaleContextValue => useContext(LocaleContext) ?? FALLBACK_VALUE
