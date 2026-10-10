import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, describe, expect, it } from 'vitest'

import { LanguageSettings } from './LanguageSettings'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { customRender } from '@/tests/lib/custom-render'

const renderLanguageSettings = () =>
  customRender(
    <LocaleProvider>
      <LanguageSettings />
    </LocaleProvider>
  )

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('LanguageSettings', () => {
  it('switches the card and the document language to Japanese', async () => {
    const user = userEvent.setup()
    renderLanguageSettings()

    expect(await screen.findByText('Language')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')

    await user.click(screen.getByRole('combobox', { name: 'Display language' }))
    await user.click(await screen.findByRole('option', { name: '日本語' }))

    expect(await screen.findByText('言語')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '表示言語' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('ja')
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_LOCALE)).toBe('"ja"')
  })

  it('opens in Japanese when that was chosen before', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_LOCALE, JSON.stringify('ja'))

    renderLanguageSettings()

    expect(await screen.findByText('言語')).toBeInTheDocument()
  })

  it('shows English when rendered without a provider', () => {
    customRender(<LanguageSettings />)

    expect(screen.getByText('Language')).toBeInTheDocument()
  })
})
