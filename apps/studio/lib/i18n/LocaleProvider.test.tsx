import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { LocaleProvider, useTranslation } from './LocaleProvider'
import { CustomWrapper } from '@/tests/lib/custom-render'

const storageKey = LOCAL_STORAGE_KEYS.UI_LOCALE

// Waits until the stored value has been read, so a test about a stored value can't pass just
// because the default is shown while the value is still loading.
const renderTranslation = async (stored?: string, { isStrictMode = false } = {}) => {
  if (stored !== undefined) localStorage.setItem(storageKey, stored)

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => {
    const content = (
      <CustomWrapper queryClient={queryClient}>
        <LocaleProvider>{children}</LocaleProvider>
      </CustomWrapper>
    )
    return isStrictMode ? <StrictMode>{content}</StrictMode> : content
  }
  const rendered = renderHook(() => useTranslation(), { wrapper })

  await waitFor(() =>
    expect(queryClient.getQueryState(['localStorage', storageKey])?.status).not.toBe('pending')
  )
  return rendered
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('LocaleProvider', () => {
  it('defaults to English', async () => {
    const { result } = await renderTranslation()

    expect(result.current.locale).toBe('en')
    expect(result.current.t('account.preferences.title')).toBe('Preferences')
  })

  it('reads the stored language', async () => {
    const { result } = await renderTranslation(JSON.stringify('ja'))

    expect(result.current.locale).toBe('ja')
    expect(result.current.t('account.preferences.title')).toBe('環境設定')
  })

  it('switches language and remembers the choice', async () => {
    const { result } = await renderTranslation()

    act(() => result.current.setLocale('ja'))

    await waitFor(() => expect(result.current.locale).toBe('ja'))
    expect(result.current.t('account.preferences.title')).toBe('環境設定')
    expect(localStorage.getItem(storageKey)).toBe('"ja"')
  })

  it.each(['"fr"', '"EN"', '42', 'null', '{"locale":"ja"}'])(
    'treats the unsupported stored value %s as English',
    async (stored) => {
      const { result } = await renderTranslation(stored)

      expect(result.current.locale).toBe('en')
    }
  )

  it('treats a stored value that is not valid JSON as English', async () => {
    const { result } = await renderTranslation('not json')

    expect(result.current.locale).toBe('en')
  })

  it('mirrors the language onto <html lang> and restores the original when unmounted', async () => {
    // Stands in for whatever the page was served with. It differs from both supported languages,
    // so a missing cleanup can't pass by accident. Strict Mode runs every effect twice.
    document.documentElement.lang = 'fr'

    const { result, unmount } = await renderTranslation(JSON.stringify('ja'), {
      isStrictMode: true,
    })
    expect(document.documentElement.lang).toBe('ja')

    act(() => result.current.setLocale('en'))
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))

    unmount()
    expect(document.documentElement.lang).toBe('fr')
  })
})

describe('useTranslation outside a provider', () => {
  it('renders English, so components can use it without a wrapper in tests', () => {
    const { result } = renderHook(() => useTranslation())

    expect(result.current.locale).toBe('en')
    expect(result.current.t('account.preferences.title')).toBe('Preferences')
  })

  it('ignores attempts to change the language', () => {
    const { result } = renderHook(() => useTranslation())

    act(() => result.current.setLocale('ja'))

    expect(result.current.locale).toBe('en')
    expect(localStorage.getItem(storageKey)).toBeNull()
  })
})
