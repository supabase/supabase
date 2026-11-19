import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageSettings } from './LanguageSettings'
import { TimezoneSettings } from './TimezoneSettings'
import { TimezoneProvider } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { customRender } from '@/tests/lib/custom-render'

const renderLanguageSettings = () =>
  customRender(
    <LocaleProvider>
      <LanguageSettings />
      <Toaster />
    </LocaleProvider>
  )

beforeEach(() => {
  document.documentElement.lang = 'en'
})

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('LanguageSettings', () => {
  it('switches translated text to Japanese while the document stays English', async () => {
    const user = userEvent.setup()
    renderLanguageSettings()

    expect(await screen.findByText('Language')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')

    await user.click(screen.getByRole('combobox', { name: 'Display language' }))
    await user.click(await screen.findByRole('option', { name: '日本語' }))

    expect(await screen.findByText('言語')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '表示言語' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByText('言語').closest('[lang]')).toHaveAttribute('lang', 'ja')
    expect(screen.getByRole('combobox', { name: '表示言語' })).toHaveAttribute('lang', 'ja')
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_LOCALE)).toBe('"ja"')
  })

  it('opens in Japanese when that was chosen before', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))

    renderLanguageSettings()

    expect(await screen.findByText('言語')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByText('言語').closest('[lang]')).toHaveAttribute('lang', 'ja')
    expect(screen.getByRole('combobox', { name: '表示言語' })).toHaveAttribute('lang', 'ja')
  })

  it('keeps the prior choice and reports a failed storage write', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))
    const user = userEvent.setup()
    renderLanguageSettings()

    const picker = await screen.findByRole('combobox', { name: '表示言語' })
    const originalSetItem = Storage.prototype.setItem
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      if (key === LOCAL_STORAGE_KEYS.UI_LOCALE)
        throw new DOMException('Storage full', 'QuotaExceededError')
      return originalSetItem.call(this, key, value)
    })
    try {
      await user.click(picker)
      await user.click(await screen.findByRole('option', { name: 'English' }))

      const error = await screen.findByText('言語設定を保存できませんでした。')
      expect(error).toHaveAttribute('lang', 'ja')
      expect(picker).toHaveTextContent('日本語')
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_LOCALE)).toBe('"ja"')
    } finally {
      write.mockRestore()
    }
  })

  it('shows English when rendered without a provider', () => {
    customRender(<LanguageSettings />)

    expect(screen.getByText('Language')).toBeInTheDocument()
  })
})

describe('partially translated preferences', () => {
  it('marks auto-detected timezone names as English in Japanese text', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))
    const timezone = guessLocalTimezone()

    customRender(
      <LocaleProvider>
        <TimezoneProvider>
          <TimezoneSettings />
        </TimezoneProvider>
      </LocaleProvider>
    )

    const picker = await screen.findByRole('combobox', { name: '表示タイムゾーン' })
    const description = screen.getByText(/^ブラウザの設定から自動で検出しました/)
    expect(description).toHaveAttribute('lang', 'ja')
    expect(description).toHaveTextContent(`ブラウザの設定から自動で検出しました（${timezone}）。`)
    expect(within(description).getByText(timezone)).toHaveAttribute('lang', 'en')

    expect(picker).toHaveTextContent(`自動検出（${timezone}）`)
    expect(within(picker).getByText(/^自動検出/)).toHaveAttribute('lang', 'ja')
    expect(within(picker).getByText(timezone)).toHaveAttribute('lang', 'en')
  })

  it('finds and selects auto detection using English or Japanese while Studio is in Japanese', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE, JSON.stringify('America/New_York'))
    const user = userEvent.setup()
    customRender(
      <LocaleProvider>
        <TimezoneProvider>
          <TimezoneSettings />
        </TimezoneProvider>
      </LocaleProvider>
    )

    await user.click(await screen.findByRole('combobox', { name: '表示タイムゾーン' }))
    const search = screen.getByPlaceholderText('タイムゾーンを検索…')
    await user.type(search, 'Auto detect')
    expect(await screen.findByRole('option', { name: /自動検出/ })).toBeVisible()

    await user.clear(search)
    await user.type(search, '自動検出')
    expect(await screen.findByRole('option', { name: /自動検出/ })).toBeVisible()

    await user.clear(search)
    await user.type(search, guessLocalTimezone())
    await user.click(await screen.findByRole('option', { name: /自動検出/ }))
    expect(await screen.findByRole('combobox', { name: '表示タイムゾーン' })).toHaveTextContent(
      '自動検出'
    )
  })

  it('keeps untranslated content English and marks translated controls and portal content', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))
    const storedTimezone = JSON.stringify('Asia/Tokyo')
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE, storedTimezone)
    const user = userEvent.setup()

    customRender(
      <LocaleProvider>
        <TimezoneProvider>
          <p>Untranslated Studio content</p>
          <LanguageSettings />
          <TimezoneSettings />
        </TimezoneProvider>
      </LocaleProvider>
    )

    expect(await screen.findByText('タイムゾーン')).toBeInTheDocument()
    expect(screen.getByText('タイムゾーン').closest('[lang]')).toHaveAttribute('lang', 'ja')
    expect(screen.getByText('Untranslated Studio content').closest('[lang]')).toHaveAttribute(
      'lang',
      'en'
    )
    expect(document.documentElement.lang).toBe('en')

    const timezonePicker = screen.getByRole('combobox', { name: '表示タイムゾーン' })
    expect(timezonePicker).toHaveAttribute('lang', 'ja')
    await user.click(timezonePicker)

    expect(screen.getByPlaceholderText('タイムゾーンを検索…')).toHaveAttribute('lang', 'ja')
    const options = within(await screen.findByRole('listbox'))
    expect(options.getByRole('option', { name: /^\(UTC\+09:00\).*Tokyo/ })).toHaveAttribute(
      'lang',
      'en'
    )
    expect(options.getByRole('option', { name: /自動検出/ })).toHaveAttribute('lang', 'ja')
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('combobox', { name: '表示言語' }))
    const languages = within(await screen.findByRole('listbox'))
    expect(languages.getByRole('option', { name: 'English' })).toHaveAttribute('lang', 'en')
    expect(languages.getByRole('option', { name: '日本語' })).toHaveAttribute('lang', 'ja')
    await user.click(languages.getByRole('option', { name: 'English' }))

    expect(await screen.findByText('Language')).toBeInTheDocument()
    expect(screen.getByText('Timezone').closest('[lang]')).toHaveAttribute('lang', 'en')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_LOCALE)).toBe('"en"')
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE)).toBe(storedTimezone)
  })
})
