import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { beforeEach, describe, expect, it } from 'vitest'

import { BannerStackProvider } from '../BannerStackProvider'
import { BannerTermsOfServiceUpdate } from './BannerTermsOfServiceUpdate'

const renderNotice = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <BannerStackProvider>
        <BannerTermsOfServiceUpdate />
      </BannerStackProvider>
    </QueryClientProvider>
  )

describe('BannerTermsOfServiceUpdate', () => {
  beforeEach(() => localStorage.clear())

  it('reveals the explanation and agreement link only after Learn more', async () => {
    const user = userEvent.setup()
    renderNotice()
    expect(screen.getByText('We’ve updated our Terms of Service')).toBeInTheDocument()
    expect(screen.queryByText(/Clarify which Supabase entity/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Learn more' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Clarify which Supabase entity/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      'https://supabase.com/terms'
    )
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await waitFor(() =>
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE)).toBe('true')
    )
  })

  it('remembers dismissal from the compact notice', async () => {
    const user = userEvent.setup()
    renderNotice()
    await user.click(screen.getByRole('button', { name: 'Close banner' }))
    await waitFor(() =>
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE)).toBe('true')
    )
  })

  it('does not acknowledge the notice when the dialog is closed', async () => {
    const user = userEvent.setup()
    renderNotice()
    await user.click(screen.getByRole('button', { name: 'Learn more' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE)).toBeNull()
  })
})
