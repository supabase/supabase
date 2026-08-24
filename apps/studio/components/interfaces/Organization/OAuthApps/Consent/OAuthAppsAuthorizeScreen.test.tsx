import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { customRender } from '@/tests/lib/custom-render'

function selectProject(projectName: string) {
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.click(screen.getByText(projectName))
}

describe('OAuthAppsAuthorizeScreen', () => {
  test('blocks authorize with zero projects selected and shows the error', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    const authorizeButton = await screen.findByRole('button', { name: /Authorize Vercel/ })
    fireEvent.click(authorizeButton)

    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('shows the over-role warning only for the read-only fixture', async () => {
    const { unmount } = customRender(
      <OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />
    )
    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText('Some requested permissions exceed your role')
    ).not.toBeInTheDocument()
    unmount()

    customRender(<OAuthAppsAuthorizeScreen mockState="over_role" navigate={vi.fn()} />)
    expect(
      await screen.findByText('Some requested permissions exceed your role')
    ).toBeInTheDocument()
  })

  test('renders the empty-org notice, hides permissions, and shows the cancel footer', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="empty_org" navigate={vi.fn()} />)

    expect(await screen.findByText('No projects in some-other-org')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Cancelling will redirect you to https://vercel.com/api/integrations/supabase/callback with access denied.'
      )
    ).toBeInTheDocument()
  })

  test('renders the publisher warning and no verified tick for the unverified fixture', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="unverified" navigate={vi.fn()} />)

    expect(
      await screen.findByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Verified' })).not.toBeInTheDocument()
  })

  test('shows the verified tick and no publisher warning for a verified fixture', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    expect(await screen.findByRole('img', { name: 'Verified' })).toBeInTheDocument()
    expect(
      screen.queryByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).not.toBeInTheDocument()
  })

  test('shows "Don\'t close this window." while the approve mutation is in flight', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByRole('combobox')
    selectProject('production')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText("Don't close this window.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()

    // Let the mock mutation's artificial delay settle before the test exits
    await new Promise((resolve) => setTimeout(resolve, 350))
  })
})
