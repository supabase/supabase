import { fireEvent, screen, waitFor } from '@testing-library/react'
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

// The authorize button renders disabled while app details are still pending.
// React Query 5.104 settles that query after the button is already in the document.
async function enabledAuthorizeButton() {
  const button = await screen.findByRole('button', { name: /Authorize Vercel/ })
  await waitFor(() => expect(button).toBeEnabled())
  return button
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
  test('requires at least one selected project before authorizing', async () => {
    renderScreen()

    expect(await screen.findByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox'))
    toggleProjectOption('northwind-storefront')
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()

    // Deselecting the last project re-disables it
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

  test('success screen shows exactly the submitted projects and scopes', async () => {
    renderScreen()

    await screen.findByRole('combobox')
    selectProject('northwind-cms')
    fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('You can return to Vercel to continue')).toBeInTheDocument()

    expect(screen.getByText('northwind-cms')).toBeInTheDocument()
    expect(screen.queryByText('northwind-storefront')).not.toBeInTheDocument()

    expect(screen.getByText('Permissions granted')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(screen.getByText('Database, Environment, Analytics')).toBeInTheDocument()
    expect(screen.getByText('Secrets, Projects, Edge Functions, Storage')).toBeInTheDocument()
  })

  test('an organization-bound app reaches the success screen with the authorizing identity', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot,
      organizationSlug: 'fabrikam-industries',
    })

    await screen.findByRole('combobox')
    selectProject('fabrikam-ledger')
    fireEvent.click(screen.getByRole('button', { name: /Authorize kemal-bot/ }))

    expect(await screen.findByText('kemal-bot is connected')).toBeInTheDocument()
    expect(screen.getByText('Authorized by')).toBeInTheDocument()
    expect(screen.getByText(/admin@example\.com/)).toBeInTheDocument()
  })

  test('tells the member an organization-bound grant is shared, exactly once, without the member-bound copy', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.kemalBot })

    expect(await screen.findAllByText('Want this scoped to one member?')).toHaveLength(1)
    expect(
      screen.getAllByText(
        'Have them authorize kemal-bot from their own account. Authorizing here gives it your Administrator access on every project, including ones created later.'
      )
    ).toHaveLength(1)
    expect(screen.queryByText(/This grant acts as you/)).not.toBeInTheDocument()
    expect(screen.queryByText(/No admin approval is needed/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/This authorization will appear in Authorized apps/)
    ).toBeInTheDocument()
  })

  test('shows the member-bound copy for a member-bound grant that picks projects', async () => {
    renderScreen()

    expect(
      await screen.findByText(/No admin approval is needed if your role permits this access/)
    ).toBeInTheDocument()
    expect(screen.getByText(/This grant acts as you/)).toBeInTheDocument()
    expect(screen.queryByText('Want this scoped to one member?')).not.toBeInTheDocument()
    expect(screen.queryByText('This grant covers every project')).not.toBeInTheDocument()
  })

  test('authorizes an app that hides the picker, covering future projects', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects })

    expect(await screen.findByText('All projects, including future ones')).toBeInTheDocument()
    expect(await enabledAuthorizeButton()).toBeEnabled()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('an org-wide app in an empty org authorizes and reports an all-projects grant', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      organizationSlug: 'contoso-labs',
    })

    const authorizeButton = await enabledAuthorizeButton()
    expect(screen.queryByText(/No projects in/)).not.toBeInTheDocument()
    fireEvent.click(authorizeButton)

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('the many-projects fixture offers enough projects to reach the selection cap', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects })

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.getAllByRole('option').length).toBeGreaterThan(MAX_SELECTED_PROJECTS)
  })

  test('re-consent preselects and submits only the still-live projects from the existing grant', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent })

    expect(await screen.findByText('tailspin-shop')).toBeInTheDocument()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
    const authorizeButton = screen.getByRole('button', { name: /Authorize Vercel/ })
    expect(authorizeButton).toBeEnabled()
    fireEvent.click(authorizeButton)

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

  test('optional project scoping offers an all-projects choice that authorizes without a selection', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects })

    expect(await screen.findByText('All current and future projects')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    const authorizeButton = screen.getByRole('button', { name: /Authorize Vercel/ })
    expect(authorizeButton).toBeEnabled()
    fireEvent.click(authorizeButton)

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('re-consent of an all-projects grant preselects the all-projects choice', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects })

    expect(await screen.findByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
  })

  test('a dynamic client is unscoped, with no optional all-projects choice', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient })

    expect(await screen.findByText('All projects, including future ones')).toBeInTheDocument()
    expect(screen.queryByText('All current and future projects')).not.toBeInTheDocument()
  })

  test('preselects the project named by the project_ref param', async () => {
    renderScreen({ projectRef: 'northwindcms1' })

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('a project_scoping_mode off app ignores the project_ref param', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      organizationSlug: 'contoso-labs',
      projectRef: 'northwindstorefront1',
    })

    fireEvent.click(await enabledAuthorizeButton())

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

  test('reconsent shows the permissions differences, with previous permissions collapsed', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent,
    })

    await screen.findByText('Already granted (2)')
    const findSpanWithText = (text: string) =>
      screen.findByText((_, element) => element?.textContent == text, { selector: 'span' })
    await findSpanWithText('Environment (New)')
    await findSpanWithText('Analytics (Upgraded from Read)')
    await findSpanWithText('Secrets (Demoted from Read-write)')
    await findSpanWithText('Edge Functions (New)')
    await findSpanWithText('Storage (New)')
    await findSpanWithText('Rest (Read)')

    expect(screen.queryByText('Database')).toBeNull()
    fireEvent.click(screen.getByText('Already granted (2)'))
    await screen.findByText('Database')
  })
})

describe('OAuthAppsAuthorizeScreen post-submit role validation', () => {
  const READ_ONLY_PROJECTS = ['fabrikam-api', 'fabrikam-jobs']
  const WRITABLE_PROJECT = 'northwind-cms'

  const selectProjects = async (names: string[]) => {
    fireEvent.click(await screen.findByRole('combobox'))
    names.forEach((name) => fireEvent.click(screen.getByText(name)))
  }

  const authorize = () => fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))

  const deselectFlagged = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Deselect 2 projects' }))

  const submitTwoBlockedAndOneAllowed = async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation })
    await selectProjects([...READ_ONLY_PROJECTS, WRITABLE_PROJECT])
    authorize()
    return screen.findByText("Couldn't authorize 2 projects")
  }

  test('flags the projects the role cannot grant after submit', async () => {
    expect(await submitTwoBlockedAndOneAllowed()).toBeInTheDocument()
    expect(
      screen.getByText(
        'Vercel needs write access but your role is read-only on the projects highlighted. Deselect them to continue.'
      )
    ).toBeInTheDocument()
    // Counted against the submitted selection
    expect(screen.getByText(/2 of 3\s+projects unavailable/)).toBeInTheDocument()
    // The primary action turns into the deselect shortcut, replacing the inline link
    expect(screen.getByRole('button', { name: 'Deselect 2 projects' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Authorize Vercel/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Deselect projects')).not.toBeInTheDocument()
    // The rejected projects are marked in the dropdown
    expect(screen.getAllByText('- Unavailable')).toHaveLength(READ_ONLY_PROJECTS.length)
  })

  test('deselecting the blocked projects clears the failure treatment and the retry succeeds', async () => {
    await submitTwoBlockedAndOneAllowed()

    deselectFlagged()

    expect(screen.queryByText("Couldn't authorize 2 projects")).not.toBeInTheDocument()
    expect(screen.queryByText(/projects unavailable/)).not.toBeInTheDocument()
    // The dropdown marks outlive the deselection
    expect(screen.getAllByText('- Unavailable')).toHaveLength(READ_ONLY_PROJECTS.length)

    authorize()
    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })

  test('a selection of only writable projects never triggers validation', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation })

    await selectProjects([WRITABLE_PROJECT])
    authorize()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })

  test('a preselected read-only project still produces the post-submit banner', async () => {
    renderScreen({
      authId: OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation,
      projectRef: 'fabrikamapi1',
    })

    await screen.findByText('fabrikam-api')
    authorize()

    expect(await screen.findByText("Couldn't authorize 1 project")).toBeInTheDocument()
  })

  test('a request outside the role-validated set approves read-only projects', async () => {
    renderScreen({ authId: OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper })

    await selectProjects([READ_ONLY_PROJECTS[0]])
    authorize()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })
})
