import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LanguageSettings } from './LanguageSettings'
import { TimezoneSettings } from './TimezoneSettings'
import { TimezoneProvider } from '@/lib/datetime'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { customRender } from '@/tests/lib/custom-render'

const renderLanguageSettings = () =>
  customRender(
    <LocaleProvider>
      <LanguageSettings />
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

  it('shows English when rendered without a provider', () => {
    customRender(<LanguageSettings />)

    expect(screen.getByText('Language')).toBeInTheDocument()
  })
})

describe('partially translated preferences', () => {
  it('keeps untranslated content English and marks translated controls and portal content', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))
    const storedTimezone = localStorage.getItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE)
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
