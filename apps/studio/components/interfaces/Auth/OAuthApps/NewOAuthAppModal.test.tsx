import type { OAuthClient } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { NewOAuthAppModal } from './NewOAuthAppModal'
import { customRender } from '@/tests/lib/custom-render'

const confidentialApp = {
  client_id: 'client-id-123',
  client_secret: 'secret-abc',
  client_name: 'My App',
} as OAuthClient

describe('NewOAuthAppModal', () => {
  test('shows the credentials and a warning that the secret is shown once', () => {
    customRender(<NewOAuthAppModal oauthApp={confidentialApp} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('client-id-123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('secret-abc')).toBeInTheDocument()
    expect(screen.getByText(/won't be shown again/)).toBeInTheDocument()
  })

  test('does not render for a public app without a client secret', () => {
    const publicApp = { ...confidentialApp, client_secret: undefined } as OAuthClient
    customRender(<NewOAuthAppModal oauthApp={publicApp} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('does not render when there is no app', () => {
    customRender(<NewOAuthAppModal oauthApp={undefined} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('can only be dismissed with the Done button', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onClose = vi.fn()
    customRender(<NewOAuthAppModal oauthApp={confidentialApp} onClose={onClose} />)

    await user.keyboard('{Escape}')
    await user.click(document.body)
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
