import type { NextPageContext } from 'next'
import { useIntl } from 'react-intl'
import { useRouter } from 'next/router'
import type enMessages from '~/i18n/en.json'

export const defaultLocale = 'en'

const availableLocales = ['en', 'ja'] as const

export type Locale = (typeof availableLocales)[number]

type IntlMessageKeys = keyof typeof enMessages

export type LocaleMessages = Record<IntlMessageKeys, string>

const translatedPages = ['/enterprise']

export const useHasTranslations = () => {
  const { pathname } = useRouter()
  return translatedPages.includes(pathname)
}

// In Japanese the order in which the name is written is reversed
export const useReverseNameOrder = () => {
  const { locale } = useIntl()
  return locale === 'ja'
}

const fetchMessages = async (locale: string) => {
  try {
    const messages = await import(`~/i18n/${locale}.json`)
    return messages
  } catch (error) {
    const defaultMessages = await import(`~/i18n/en.json`)
    return defaultMessages
  }
}

const getLocaleFromContext = (ctx: NextPageContext) => {
  const pathWithQuery = ctx.req?.url ?? ctx.asPath ?? '/'
  const pathLocale = pathWithQuery.split('/')[1]
  return availableLocales.includes(pathLocale) ? pathLocale : defaultLocale
}

export const extractIntlFromContext = async (ctx: NextPageContext) => {
  const locale = getLocaleFromContext(ctx)
  const messages = await fetchMessages(locale)
  return { messages, locale }
}

const getUrlWithoutLocale = (currentLocale: string, path: string) => {
  if (currentLocale === defaultLocale) {
    return path
  }
  const [, , ...pathParts] = path.split('/')
  return `/${pathParts.join('/')}`
}

export const buildLocaleUrl = (currentLocale: string, newLocale: string, path: string) => {
  const url = getUrlWithoutLocale(currentLocale, path)
  if (newLocale === defaultLocale) {
    return url
  }
  return `/${newLocale}${url}`
}

export type TranslateFunction = (id: IntlMessageKeys) => string

export const useT = (): TranslateFunction => {
  const { formatMessage } = useIntl()
  const t = (id: IntlMessageKeys) => formatMessage({ id })
  return t
}
