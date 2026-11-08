import type { OAuthClient } from '@supabase/supabase-js'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, test, vi } from 'vitest'

import { NewOAuthAppModal } from './NewOAuthAppModal'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const CONFIDENTIAL_OAUTH_APP: OAuthClient = {
  client_id: 'client-id-1234',
  client_name: 'My Confidential App',
  client_secret: 'secret-value-5678',
  client_type: 'confidential',
  token_endpoint_auth_method: 'client_secret_basic',
  registration_type: 'manual',
  redirect_uris: ['https://example.com/callback'],
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const PUBLIC_OAUTH_APP: OAuthClient = {
  ...CONFIDENTIAL_OAUTH_APP,
  client_name: 'My Public App',
  client_type: 'public',
  token_endpoint_auth_method: 'none',
  client_secret: undefined,
}

describe('NewOAuthAppModal', () => {
  test('does not open when oauthApp is undefined', () => {
    customRender(<NewOAuthAppModal oauthApp={undefined} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('does not open for public apps without a client secret', () => {
    customRender(<NewOAuthAppModal oauthApp={PUBLIC_OAUTH_APP} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('displays client ID, client secret, copy buttons, and one-time secret warning', async () => {
    customRender(<NewOAuthAppModal oauthApp={CONFIDENTIAL_OAUTH_APP} onClose={vi.fn()} />)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Save your client secret')).toBeInTheDocument()
    expect(screen.getByText(/The secret won't be shown again/i)).toBeInTheDocument()

    expect(screen.getByDisplayValue('client-id-1234')).toBeInTheDocument()
    expect(screen.getByDisplayValue('secret-value-5678')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(2)
  })

  test('does not close on Escape or outside interaction and has no close icon button', async () => {
    const onClose = vi.fn()
    customRender(<NewOAuthAppModal oauthApp={CONFIDENTIAL_OAUTH_APP} onClose={onClose} />)

    const dialog = await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    fireEvent.click(document.body)
    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toBeInTheDocument()
  })

  test('calls onClose when clicking Done', async () => {
    const onClose = vi.fn()
    customRender(<NewOAuthAppModal oauthApp={CONFIDENTIAL_OAUTH_APP} onClose={onClose} />)

    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
