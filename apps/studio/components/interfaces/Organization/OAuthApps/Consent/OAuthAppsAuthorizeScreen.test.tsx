import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { MAX_SELECTED_PROJECTS } from './ProjectMultiSelect'
import {
  getMockOAuthAppsAuthorizeRequest,
  OAUTH_APPS_MOCK_SCENARIOS,
} from '@/data/oauth-apps/mocks'
import type { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/types'
import { customRender } from '@/tests/lib/custom-render'

type RenderScreenOptions = {
  authId?: string
  request?: OAuthAppsAuthorizeRequest
  organizationSlug?: string
  projectRef?: string
}

function renderScreen({
  authId = OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper,
  request,
  organizationSlug,
  projectRef,
}: RenderScreenOptions = {}) {
  return customRender(
    <OAuthAppsAuthorizeScreen
      authId={authId}
      request={request ?? getMockOAuthAppsAuthorizeRequest(authId)}
      organizationSlug={organizationSlug}
      projectRef={projectRef}
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
    expect(screen.getByText('Database, Environment, Secrets')).toBeInTheDocument()
    expect(screen.getByText('Projects, Edge Functions, Storage')).toBeInTheDocument()
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

  test('tells the member an organization-bound grant is shared, exactly once', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    expect(
      await screen.findAllByText('This grant is shared with the whole organization')
    ).toHaveLength(1)
    expect(
      screen.getAllByText(
        'kemal-bot acts with owner permissions for every member of northwind-traders, and stays active if you leave.'
      )
    ).toHaveLength(1)
  })

  test('keeps the no-admin-approval footer line for a member-bound grant', async () => {
    renderScreen()

    expect(
      await screen.findByText(/No admin approval is needed if your role permits this access/)
    ).toBeInTheDocument()
  })

  test('drops the no-admin-approval footer line for an organization-bound grant', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    await screen.findByText('Permissions requested')
    expect(screen.queryByText(/No admin approval is needed/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/This authorization will appear in Authorized apps/)
    ).toBeInTheDocument()
  })

  test('shows no shared-grant messaging for a member-bound grant', async () => {
    renderScreen()

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText('This grant is shared with the whole organization')
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/acts with owner permissions/)).not.toBeInTheDocument()
    expect(screen.queryByText(/This grant acts as you/)).not.toBeInTheDocument()
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

  test('the many-projects fixture offers enough projects to reach the selection cap', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects })

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.getAllByRole('option').length).toBeGreaterThan(MAX_SELECTED_PROJECTS)
  })

  test('re-consent preselects the still-live projects from the existing grant', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent })

    expect(await screen.findByText('tailspin-shop')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('re-consent submits only the still-live preselected projects', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent })

    await screen.findByText('tailspin-shop')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    await screen.findByText('Vercel is connected')

    expect(screen.getByText(/tailspin-shop/)).toBeInTheDocument()
    expect(screen.queryByText(/tailspin-warehouse/)).not.toBeInTheDocument()
    expect(screen.queryByText(/tailspin-deleted/)).not.toBeInTheDocument()
  })

  test('the existing grant does not leak into an organization it was not granted for', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent,
      organizationSlug: 'northwind-traders',
    })

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('offers the all-projects choice only when project scoping is optional', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects })

    expect(await screen.findByText('All current and future projects')).toBeInTheDocument()
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

  test('a dynamic client renders the same required picker as an authored app', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient })

    expect(screen.queryByText('All current and future projects')).not.toBeInTheDocument()
    expect(screen.queryByText(/registered automatically/)).not.toBeInTheDocument()
  })

  test('preselects the project named by the project_ref param', async () => {
    renderScreen({ projectRef: 'northwindcms1' })

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('an unknown project_ref preselects nothing and shows no notice', async () => {
    renderScreen({ projectRef: 'no-such-ref' })

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
    expect(screen.queryByText(/couldn't be preselected/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('a project_scoping_mode off app ignores the project_ref param', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      organizationSlug: 'contoso-labs',
      projectRef: 'northwindstorefront1',
    })

    fireEvent.click(await screen.findByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
    expect(screen.queryByText(/northwind-storefront/)).not.toBeInTheDocument()
  })

  test('resolves the organization that owns the project_ref when none is given', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects,
      projectRef: 'northwindcms1',
    })

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByText('northwind-traders')).toBeInTheDocument()
  })

  test('the existing grant wins over the project_ref param', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent,
      organizationSlug: 'tailspin-toys',
      projectRef: 'tailspinwarehouse1',
    })

    expect(await screen.findByText('tailspin-shop')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).not.toHaveTextContent('tailspin-warehouse')
  })
})
