import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { NewScopedTokenSheet } from './NewScopedTokenSheet'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse_Output']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
type CreateTokenResponse = components['schemas']['CreateScopedAccessTokenResponse_Output']
type CreateClassicTokenResponse = components['schemas']['CreateAccessTokenResponse_Output']
type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

const mockUseReducedMotion = vi.fn(() => false)
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useReducedMotion: () => mockUseReducedMotion() }
})

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

// Each test mounts the full sheet and walks several async steps. That takes ~1s on an idle
// machine but approaches the default 5s limit when CI workers are saturated.
vi.setConfig({ testTimeout: 15_000 })

const user = userEvent.setup({
  writeToClipboard: true,
})

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const mockOrganizations = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ slug: 'acme-prod', name: 'Acme Production' }),
      ]),
  })

const mockProjects = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects',
    response: () =>
      HttpResponse.json<ProjectsResponse>({
        pagination: { count: 1, limit: 100, offset: 0 },
        projects: [
          {
            ...createMockProject({
              id: 1,
              ref: 'project-1',
              name: 'Project 1',
              organization_id: 1,
            }),
            organization_slug: 'acme-prod',
            preview_branch_refs: [],
          },
        ],
      }),
  })

const mockOrgProjects = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>({
        pagination: { count: 1, limit: 100, offset: 0 },
        projects: [
          {
            cloud_provider: 'AWS',
            databases: [],
            inserted_at: new Date().toISOString(),
            integration_source: null,
            is_branch: false,
            name: 'Project 1',
            ref: 'project-1',
            region: 'us-east-1',
            status: 'ACTIVE_HEALTHY',
          },
        ],
      }),
  })

// The review screen's project pill looks up the selected project
const mockProjectDetail = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetailResponse>({
        ...createMockProject({ id: 1, ref: 'project-1', name: 'Project 1', organization_id: 1 }),
        connectionString: null,
        db_host: 'db.project-1.supabase.co',
        high_availability: false,
        integration_source: null,
        inserted_at: '2026-01-01T00:00:00Z',
        is_physical_backups_enabled: false,
        restUrl: 'https://project-1.supabase.co',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2026-01-01T00:00:00Z',
      }),
  })

const mockPermissionsMap = () =>
  addAPIMock({
    method: 'get',
    // @ts-expect-error Studio API is missing from types
    path: '/scoped-access-token-permissions',
    response: () =>
      HttpResponse.json({
        scopes: {},
        endpoints: {},
        mcp_tools: {},
      }),
  })

const mockCreateToken = () =>
  addAPIMock({
    method: 'post',
    path: '/platform/profile/scoped-access-tokens',
    response: () =>
      HttpResponse.json<CreateTokenResponse>({
        created_at: '',
        expires_at: null,
        id: 'plop',
        last_used_at: null,
        name: 'test',
        token: 'a_token_value',
        token_alias: '',
        permissions: [],
      }),
  })

const mockCreateClassicToken = () =>
  addAPIMock({
    method: 'post',
    path: '/platform/profile/access-tokens',
    response: () =>
      HttpResponse.json<CreateClassicTokenResponse>({
        created_at: '',
        expires_at: null,
        id: 1,
        last_used_at: null,
        name: 'test',
        token: 'a_classic_token_value',
        token_alias: '',
      }),
  })

/**
 * Permission categories render collapsed, so a category has to be expanded before its
 * rows are in the DOM.
 */
const expandPermissionCategory = async (name: string) =>
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }))

/**
 * Each permission row renders a hidden native <select>, so an unscoped option query has to
 * check the visibility of hundreds of options (~300ms per query). Scope it to the open listbox.
 */
const findOption = async (name: string | RegExp) =>
  within(await screen.findByRole('listbox')).findByRole('option', { name })

describe('NewScopedTokenSheet', () => {
  const renderSheet = () =>
    customRender(<NewScopedTokenSheet onCreateExperimentalToken={() => {}} />, {
      profileContext: PROFILE_CONTEXT,
    })

  beforeEach(() => {
    mockTrack.mockReset()
    mockPermissionsMap()
    mockOrganizations()
    mockProjects()
    mockOrgProjects()
    mockProjectDetail()
    mockCreateToken()
    mockCreateClassicToken()
  })
  const openSheet = async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
  }

  // Typing character-by-character isn't the behaviour under test, and every keystroke
  // re-renders the whole (large) form
  const enterName = async (name = 'test') =>
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: name } })

  const clickReview = async () =>
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))

  const selectOption = async (combobox: string, option: string) => {
    fireEvent.click(await screen.findByRole('combobox', { name: combobox }))
    fireEvent.click(await findOption(option))
  }

  const grantProjectSettingsRead = async () => {
    await expandPermissionCategory('Project')
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await findOption('Read'))
  }

  const fillProjectScopedForm = async () => {
    await enterName()
    await selectOption('Organization', 'Acme Production')
    await selectOption('Projects', 'Project 1')
    await grantProjectSettingsRead()
  }

  const selectOrganizationScope = async () =>
    user.click(await screen.findByRole('radio', { name: /Organization/ }))

  const findMissingPermissionsWarning = () =>
    screen.findByText('No permissions selected', { selector: '[role="alert"] *' })

  // Project scope tests
  test('validates the Project scope fields in order', async () => {
    await openSheet()
    await clickReview()
    expect(await screen.findByText('Please enter a name for the token'))

    await enterName()
    await clickReview()
    expect(await screen.findByText('Please select an organization to continue.'))

    await selectOption('Organization', 'Acme Production')
    await clickReview()
    expect(await screen.findByText('Please select a project to continue.'))

    await selectOption('Projects', 'Project 1')
    await clickReview()
    expect(await findMissingPermissionsWarning())
  })

  test('creates the token when scope is Project, without an expiry for the Never preset', async () => {
    let createBody: Record<string, unknown> | undefined
    addAPIMock({
      method: 'post',
      path: '/platform/profile/scoped-access-tokens',
      response: async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json<CreateTokenResponse>({
          created_at: '',
          expires_at: null,
          id: 'plop',
          last_used_at: null,
          name: 'test',
          token: 'a_token_value',
          token_alias: '',
          permissions: [],
        })
      },
    })
    await openSheet()
    await selectOption('Expires in', 'Never')
    await fillProjectScopedForm()
    await clickReview()
    // Review screen — Project Settings is a high-risk entry, downgraded one tier for read-only
    await screen.findByText('Medium risk')
    await screen.findByText('Read on 1 capability, across 1 project.')
    await screen.findByText('Never')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // Must be a real click, which focuses the button: nothing holds focus once the form
    // unmounts, and copyToClipboard bails out when the document has no focus
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    expect(createBody).toBeDefined()
    expect(createBody?.expires_at).toBeUndefined()
    expect(mockTrack).toHaveBeenCalledWith(
      'access_token_created',
      expect.objectContaining({ expiryPreset: 'never' })
    )
    expect(mockTrack).toHaveBeenCalledWith('access_token_copied', { tokenType: 'scoped' })
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    expect(mockTrack).toHaveBeenCalledWith('access_token_stored_checkbox_clicked', {
      tokenType: 'scoped',
      isChecked: true,
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    expect(mockTrack).toHaveBeenCalledWith('access_token_done_button_clicked', {
      tokenType: 'scoped',
      hasCopiedToken: true,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // Completing the flow via Done must not also emit a dismissed event
    expect(mockTrack).not.toHaveBeenCalledWith(
      'access_token_creation_sheet_dismissed',
      expect.anything()
    )
  })

  test('tracks dismissal with the in-progress resourceAccess and touched state on Cancel', async () => {
    await openSheet()
    await selectOrganizationScope()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(mockTrack).toHaveBeenCalledWith('access_token_creation_sheet_dismissed', {
      resourceAccess: 'organization',
      formStep: 'form',
      isFormTouched: true,
      trigger: 'user',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  test('tracks dismissal with the untouched default resourceAccess on Escape', async () => {
    await openSheet()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' })
    expect(mockTrack).toHaveBeenCalledWith('access_token_creation_sheet_dismissed', {
      resourceAccess: 'project',
      formStep: 'form',
      isFormTouched: false,
      trigger: 'user',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  test('tracks the review step when the sheet is dismissed from the review screen', async () => {
    await openSheet()
    await fillProjectScopedForm()
    await clickReview()
    await screen.findByText('Medium risk')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(mockTrack).toHaveBeenCalledWith('access_token_creation_sheet_dismissed', {
      resourceAccess: 'project',
      formStep: 'review',
      isFormTouched: true,
      trigger: 'user',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  test('tracks a permissions load error as the dismissal trigger and closes the sheet', async () => {
    addAPIMock({
      method: 'get',
      // @ts-expect-error Studio API is missing from types
      path: '/scoped-access-token-permissions',
      response: () => HttpResponse.json({ message: 'unavailable' }, { status: 500 }),
    })
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('access_token_creation_sheet_dismissed', {
        resourceAccess: 'project',
        formStep: 'form',
        isFormTouched: false,
        trigger: 'permissions_load_error',
      })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const dismissedCalls = mockTrack.mock.calls.filter(
      ([event]) => event === 'access_token_creation_sheet_dismissed'
    )
    expect(dismissedCalls).toHaveLength(1)
  })

  // Organization scope tests
  test('validates the Organization scope and scrolls the missing permissions warning once per attempt', async () => {
    const scrollIntoView = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    try {
      await openSheet()
      await enterName()
      await selectOrganizationScope()
      await clickReview()
      expect(await screen.findByText('Please select an organization to continue.'))

      await selectOption('Organizations', 'Acme Production')
      scrollIntoView.mockClear()
      await clickReview()
      await findMissingPermissionsWarning()
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
      expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'nearest' })

      // Re-rendering the form while the warning is up must not scroll again
      await expandPermissionCategory('Database')
      expect(scrollIntoView).toHaveBeenCalledTimes(1)

      await clickReview()
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2))
    } finally {
      scrollIntoView.mockRestore()
    }
  })
  test('does not re-scroll when the motion preference changes while the warning is visible', async () => {
    const scrollIntoView = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    try {
      await openSheet()
      await enterName()
      await selectOrganizationScope()
      await selectOption('Organizations', 'Acme Production')

      await clickReview()
      await findMissingPermissionsWarning()
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))

      mockUseReducedMotion.mockReturnValue(true)
      // Round-tripping the resource-access scope re-renders the form (resourceAccess is
      // watched at the top level) without touching missingPermissionsAttempts, so the
      // warning stays up — this is what would surface a stale effect dependency on the
      // motion preference.
      await user.click(await screen.findByRole('radio', { name: /Project/ }))
      await selectOrganizationScope()
      await findMissingPermissionsWarning()
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
    } finally {
      mockUseReducedMotion.mockReturnValue(false)
      scrollIntoView.mockRestore()
    }
  })
  test('creates the token when scope is Organization', async () => {
    await openSheet()
    await enterName()
    await selectOrganizationScope()
    await selectOption('Organizations', 'Acme Production')
    await grantProjectSettingsRead()
    await clickReview()
    await screen.findByText('Medium risk')
    await screen.findByText('Read on 1 capability, across 1 organization.')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
  })

  // Permission preset tests
  const FULL_ACCESS_WARNING =
    'Grants the highest access each resource offers, including write access to your database, API keys, and organization members.'

  const getPresetTrigger = async () => screen.findByRole('combobox', { name: 'Permission preset' })

  const openPresetMenu = async () => {
    await openSheet()
    fireEvent.click(await getPresetTrigger())
  }

  test('applies a preset to every permission row', async () => {
    await openPresetMenu()
    fireEvent.click(await findOption('Read-only'))

    expect((await getPresetTrigger()).textContent).toContain('Read-only')
    // The bulk change is announced rather than left to the user to notice
    expect((await screen.findByRole('status')).textContent).toBe('All permissions set to read')

    await expandPermissionCategory('Project')
    const select = await screen.findByLabelText('Project Settings', { exact: false })
    expect(select.textContent).toBe('Read')
  })

  test('warns about full access, and falls back to Custom when a row diverges from the preset', async () => {
    await openPresetMenu()

    const fullAccess = await findOption(/^Full access/)
    const describedBy = fullAccess.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(describedBy!)?.textContent).toBe(FULL_ACCESS_WARNING)

    fireEvent.click(fullAccess)
    // The warning survives the menu closing
    await screen.findByText(FULL_ACCESS_WARNING, { selector: '[role="alert"] *' })
    expect((await getPresetTrigger()).textContent).toContain('Full access')

    await expandPermissionCategory('Project')
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await findOption('None'))

    await waitFor(async () => expect((await getPresetTrigger()).textContent).toContain('Custom'))
    expect(screen.queryByText(FULL_ACCESS_WARNING, { selector: '[role="alert"] *' })).toBeNull()
  })

  test('opens the experimental API dialog from the dropdown', async () => {
    renderSheet()
    await user.click(await screen.findByRole('button', { name: 'Choose token scope' }))
    await user.click(
      await screen.findByRole('menuitem', { name: 'Generate token for experimental API' })
    )
    // The experimental API dialog is open
    await screen.findByText(
      'The experimental API provides additional endpoints which allows you to manage your organizations and projects.'
    )
  })

  // Classic (account-wide) token tests
  test('switches to the classic token form via the legacy link', async () => {
    await openSheet()
    // Trigger a resource validation error before entering legacy mode
    await enterName()
    await clickReview()
    await screen.findByText('Please select an organization to continue.')
    await user.click(await screen.findByText('Create legacy token'))
    // The classic warning replaces resource access and permissions
    await screen.findByText('Access tokens can be used to control your whole account')
    expect(screen.queryByRole('button', { name: 'Review access' })).toBeNull()
    await screen.findByRole('button', { name: 'Generate token' })
    // Switching back restores the scoped form, without resurfacing the stale resource error
    await user.click(await screen.findByText('Create scoped token'))
    await screen.findByRole('button', { name: 'Review access' })
    expect(screen.queryByText('Access tokens can be used to control your whole account')).toBeNull()
    expect(screen.queryByText('Please select an organization to continue.')).toBeNull()
  })
  test('creates a classic token via the legacy link', async () => {
    await openSheet()
    await enterName()
    await user.click(await screen.findByText('Create legacy token'))
    fireEvent.click(await screen.findByRole('button', { name: 'Generate token' }))
    // If we can click this button, the token was created
    // Must be a real click, which focuses the button: nothing holds focus once the form
    // unmounts, and copyToClipboard bails out when the document has no focus
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_classic_token_value')
    )
    // resourceAccess must be tracked as 'account' — it is the only path that emits that value
    expect(mockTrack).toHaveBeenCalledWith('access_token_created', {
      tokenType: 'classic',
      expiryPreset: '7d',
      resourceAccess: 'account',
    })
    expect(mockTrack).toHaveBeenCalledWith('access_token_copied', { tokenType: 'classic' })
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    expect(mockTrack).toHaveBeenCalledWith('access_token_done_button_clicked', {
      tokenType: 'classic',
      hasCopiedToken: true,
    })
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
