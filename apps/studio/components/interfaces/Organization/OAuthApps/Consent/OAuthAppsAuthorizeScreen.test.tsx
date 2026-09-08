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

  test('shows no upfront over-role warning, even for the read-only fixture', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="over_role" navigate={vi.fn()} />)

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText('Some requested permissions exceed your role')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })

  test('renders the empty-org notice, hides permissions, and shows the cancel footer', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="empty_org" navigate={vi.fn()} />)

    expect(await screen.findByText('No projects in contoso-labs')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Cancelling will redirect you to https://vercel.com/api/integrations/supabase/callback with access denied.'
      )
    ).toBeInTheDocument()
  })

  test('renders the publisher warning for the unverified fixture', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="unverified" navigate={vi.fn()} />)

    expect(
      await screen.findByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).toBeInTheDocument()
  })

  test('shows no publisher warning and no verified tick for a verified fixture', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Verified' })).not.toBeInTheDocument()
  })

  test('renders the success screen after the approve mutation resolves', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('You can return to Vercel to continue')).toBeInTheDocument()
  })

  test('success screen shows exactly the submitted projects and scopes', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByRole('combobox')
    selectProject('northwind-cms')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    await screen.findByText('Vercel is connected')

    expect(screen.getByText('northwind-cms')).toBeInTheDocument()
    expect(screen.queryByText('northwind-storefront, northwind-cms')).not.toBeInTheDocument()
    expect(screen.queryByText('northwind-storefront')).not.toBeInTheDocument()

    expect(screen.getByText('Permissions granted')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(
      screen.getByText('Project Settings, Action Runs, Logs, SQL Snippets')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Database Webhooks, Development Branches, Production Branches')
    ).toBeInTheDocument()
  })

  test('unverified fixture reaches the success screen with the authorizing identity', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="unverified" navigate={vi.fn()} />)

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')
    fireEvent.click(screen.getByRole('button', { name: /Authorize kemal-bot/ }))

    expect(await screen.findByText('kemal-bot is connected')).toBeInTheDocument()
    expect(screen.getByText('Authorized by')).toBeInTheDocument()
    expect(screen.getByText(/admin@example\.com/)).toBeInTheDocument()
  })
})
