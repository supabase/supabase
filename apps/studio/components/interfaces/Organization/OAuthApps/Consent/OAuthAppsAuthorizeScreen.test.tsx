import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { MAX_SELECTED_PROJECTS } from './ProjectMultiSelect'
import {
  getMockOAuthAppsAuthorizeRequest,
  OAUTH_APPS_MOCK_SCENARIOS,
} from '@/data/oauth-apps/mocks'
import type { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { customRender } from '@/tests/lib/custom-render'

type RenderScreenOptions = {
  authId?: string
  request?: OAuthAppsAuthorizeRequest
  organizationSlug?: string
}

function renderScreen({
  authId = OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
  request,
  organizationSlug,
}: RenderScreenOptions = {}) {
  return customRender(
    <OAuthAppsAuthorizeScreen
      authId={authId}
      request={request ?? getMockOAuthAppsAuthorizeRequest(authId)}
      organizationSlug={organizationSlug}
      navigate={vi.fn()}
    />
  )
}

function selectProject(projectName: string) {
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.click(screen.getByText(projectName))
}

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
    renderScreen()

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('enables authorize and drops the constraint once a project is selected', async () => {
    renderScreen()

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')

    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('re-disables authorize when the last project is deselected', async () => {
    renderScreen()

    fireEvent.click(await screen.findByRole('combobox'))
    toggleProjectOption('northwind-storefront')
    toggleProjectOption('northwind-storefront')

    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('shows no upfront over-role warning, even for the read-only fixture', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly })

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText('Some requested permissions exceed your role')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })

  test('renders the empty-org notice, hides permissions, and shows the cancel footer', async () => {
    renderScreen({ organizationSlug: 'contoso-labs' })

    expect(await screen.findByText('No projects in contoso-labs')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Cancelling will redirect you to https://vercel.com/api/integrations/supabase/callback with access denied.'
      )
    ).toBeInTheDocument()
  })

  test('renders the publisher warning for an unverified app', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    expect(
      await screen.findByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).toBeInTheDocument()
  })

  test('shows no publisher warning and no verified tick for a verified app', async () => {
    renderScreen()

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText(
        "This publisher isn't verified by Supabase. Only continue if you trust it."
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Verified' })).not.toBeInTheDocument()
  })

  test('renders the success screen after the approve mutation resolves', async () => {
    renderScreen()

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('You can return to Vercel to continue')).toBeInTheDocument()
  })

  test('success screen shows exactly the submitted projects and scopes', async () => {
    renderScreen()

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

  test('an organization-bound app reaches the success screen with the authorizing identity', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    await screen.findByRole('combobox')
    selectProject('northwind-storefront')
    fireEvent.click(screen.getByRole('button', { name: /Authorize kemal-bot/ }))

    expect(await screen.findByText('kemal-bot is connected')).toBeInTheDocument()
    expect(screen.getByText('Authorized by')).toBeInTheDocument()
    expect(screen.getByText(/admin@example\.com/)).toBeInTheDocument()
  })

  test('tells the member an organization-bound grant is shared', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    expect(
      await screen.findByText('This grant is shared with the whole organization')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'kemal-bot acts with owner permissions for every member of northwind-traders, and stays active if you leave.'
      )
    ).toBeInTheDocument()
  })

  test('keeps the acts-as-you reassurance for a user-bound grant', async () => {
    renderScreen()

    expect(
      await screen.findByText(
        'This grant acts as you. It can never do more than your role in this organization allows.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText('This grant is shared with the whole organization')
    ).not.toBeInTheDocument()
  })

  test('says the grant covers future projects when there is no picker', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects })

    expect(await screen.findByText('This grant covers every project')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Vercel can reach every project in northwind-traders, including ones created later.'
      )
    ).toBeInTheDocument()
  })

  test('does not claim future projects when the member picks them', async () => {
    renderScreen()

    await screen.findByText('Permissions requested')
    expect(screen.queryByText('This grant covers every project')).not.toBeInTheDocument()
  })

  test('authorizes an app that hides the picker, with nothing selected', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects })

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('does not demand projects from an empty org when the app is org-wide', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      organizationSlug: 'contoso-labs',
    })

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(screen.queryByText(/No projects in/)).not.toBeInTheDocument()
  })

  test('reports an all-projects grant as such rather than listing projects', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      organizationSlug: 'contoso-labs',
    })

    fireEvent.click(await screen.findByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('renders the cross-workspace notice for a client that reuses one grant', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelCrossWorkspace })

    expect(
      await screen.findByText(
        "Some clients may reuse one authorization across workspaces. Check your client's workspace or account settings if project access does not behave as expected."
      )
    ).toBeInTheDocument()
  })

  test('hides the cross-workspace notice for a client that does not reuse a grant', async () => {
    renderScreen()

    await screen.findByText('Permissions requested')
    expect(screen.queryByText(/reuse one authorization across workspaces/)).not.toBeInTheDocument()
  })

  test('the many-projects fixture offers enough projects to reach the selection cap', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects })

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.getAllByRole('option').length).toBeGreaterThan(MAX_SELECTED_PROJECTS)
  })

  test('re-consent preselects the still-live projects from the existing grant', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent })

    expect(await screen.findByText('northwind-storefront')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('re-consent submits only the still-live preselected projects', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent })

    await screen.findByText('northwind-storefront')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    await screen.findByText('Vercel is connected')

    expect(screen.getByText(/northwind-storefront/)).toBeInTheDocument()
    expect(screen.getByText(/northwind-cms/)).toBeInTheDocument()
    expect(screen.queryByText(/northwind-deleted/)).not.toBeInTheDocument()
  })

  test('offers the all-projects choice only when project selection is optional', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects })

    expect(await screen.findByText('All current and future projects')).toBeInTheDocument()
  })

  test('hides the all-projects choice when project selection is required', async () => {
    renderScreen()

    await screen.findByRole('combobox')
    expect(screen.queryByText('All current and future projects')).not.toBeInTheDocument()
  })

  test('choosing all projects enables authorize without a selection', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects })

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))

    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  test('an all-projects approval reports the grant as all projects', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects })

    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('re-consent of an all-projects grant preselects the all-projects choice', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects })

    expect(await screen.findByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
  })

  test('shows the fixed-settings note for a dynamic client, with a required picker', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient })

    expect(
      await screen.findByText(
        'This client was registered automatically. Supabase sets its access settings.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.queryByText('All current and future projects')).not.toBeInTheDocument()
  })

  test('shows no fixed-settings note for an authored app', async () => {
    renderScreen()

    await screen.findByRole('combobox')
    expect(screen.queryByText(/registered automatically/)).not.toBeInTheDocument()
  })
})
