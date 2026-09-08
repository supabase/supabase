import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { MAX_SELECTED_PROJECTS } from './ProjectMultiSelect'
import { customRender } from '@/tests/lib/custom-render'

function selectProject(projectName: string) {
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.click(screen.getByText(projectName))
}

// The list stays open after a selection, and the project name then matches both an option row
// and the trigger badge - so target the row explicitly to toggle the same project twice.
function toggleProjectOption(projectName: string) {
  const option = screen
    .getAllByText(projectName)
    .map((element) => element.closest('[role="option"]'))
    .find((element): element is HTMLElement => element instanceof HTMLElement)

  if (!option) throw new Error(`No option row found for "${projectName}"`)
  fireEvent.click(option)
}

describe('OAuthAppsAuthorizeScreen', () => {
  test('disables authorize and states the constraint while nothing is selected', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('enables authorize and drops the constraint once a project is selected', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')

    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('re-disables authorize when the last project is deselected', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    fireEvent.click(await screen.findByRole('combobox'))
    toggleProjectOption('northwind-storefront')
    toggleProjectOption('northwind-storefront')

    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
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

  test('renders the cross-workspace notice for a client that reuses one grant', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="cross_workspace" navigate={vi.fn()} />)

    expect(
      await screen.findByText(
        "Some clients may reuse one authorization across workspaces. Check your client's workspace or account settings if project access does not behave as expected."
      )
    ).toBeInTheDocument()
  })

  test('hides the cross-workspace notice for a client that does not reuse a grant', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByText('Permissions requested')
    expect(screen.queryByText(/reuse one authorization across workspaces/)).not.toBeInTheDocument()
  })

  test('warns an org admin that the grant carries their full access', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="admin_warning" navigate={vi.fn()} />)

    expect(await screen.findByText('Want this scoped to one member?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Have them authorize Vercel from their own account. Authorizing here gives it your full admin access.'
      )
    ).toBeInTheDocument()
  })

  test('names the owner role rather than admin when the member is an owner', async () => {
    customRender(
      <OAuthAppsAuthorizeScreen
        mockState="admin_warning"
        organizationSlug="fabrikam-industries"
        navigate={vi.fn()}
      />
    )

    expect(await screen.findByText('Want this scoped to one member?')).toBeInTheDocument()
    expect(screen.getByText(/your full owner access\./)).toBeInTheDocument()
    expect(screen.queryByText(/your full admin access/)).not.toBeInTheDocument()
  })

  test('shows no admin warning for a member below admin', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await screen.findByText('Permissions requested')
    expect(screen.queryByText('Want this scoped to one member?')).not.toBeInTheDocument()
  })

  test('the max-projects state offers enough projects to reach the selection cap', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="max_projects" navigate={vi.fn()} />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.getAllByRole('option').length).toBeGreaterThan(MAX_SELECTED_PROJECTS)
  })

  test('stacks the cross-workspace notice and the admin warning when both apply', async () => {
    customRender(
      <OAuthAppsAuthorizeScreen
        mockState="cross_workspace"
        organizationSlug="tailspin-toys"
        navigate={vi.fn()}
      />
    )

    expect(await screen.findByText(/reuse one authorization across workspaces/)).toBeInTheDocument()
    expect(screen.getByText('Want this scoped to one member?')).toBeInTheDocument()
  })
})
