import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { NewScopedTokenSheet } from './NewScopedTokenSheet'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse']
type CreateTokenResponse = components['schemas']['CreateScopedAccessTokenResponse']
type CreateClassicTokenResponse = components['schemas']['CreateAccessTokenResponse']

const mockUseReducedMotion = vi.fn(() => false)
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useReducedMotion: () => mockUseReducedMotion() }
})

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

describe('NewScopedTokenSheet', () => {
  const renderSheet = () =>
    customRender(<NewScopedTokenSheet onCreateExperimentalToken={() => {}} />, {
      profileContext: PROFILE_CONTEXT,
    })

  beforeEach(() => {
    mockPermissionsMap()
    mockOrganizations()
    mockProjects()
    mockCreateToken()
    mockCreateClassicToken()
  })
  test('requires a token name', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please enter a name for the token'))
  })
  // Project scope tests
  test('requires an organization when scope is Project', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select an organization to continue.'))
  })
  test('requires a project when scope is Project', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select a project to continue.'))
  })
  test('requires permissions when scope is Project', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Project 1' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('No permissions selected', { selector: '[role="alert"] *' }))
  })
  test('creates the token when scope is Project', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Project 1' }))
    await expandPermissionCategory('Project')
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'Read' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    // Review screen — Project Settings is a high-risk entry, downgraded one tier for read-only
    await screen.findByText('Medium risk')
    await screen.findByText('Read on 1 capability, across 1 project.')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // If we can click this checkbox, the token was created
    // Must be a real click, which focuses the button: nothing holds focus once the form
    // unmounts, and copyToClipboard bails out when the document has no focus
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  }, 10_000)

  // Organization scope tests
  test('requires an organization when scope is Organization', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select an organization to continue.'))
  })
  test('requires permissions when scope is Organization', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('No permissions selected', { selector: '[role="alert"] *' }))
  })
  test('scrolls the missing permissions warning into view once per attempt', async () => {
    const scrollIntoView = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    scrollIntoView.mockClear()

    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    await screen.findByText('No permissions selected', { selector: '[role="alert"] *' })
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'nearest' })

    // Re-rendering the form while the warning is up must not scroll again
    await expandPermissionCategory('Database')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2))
    scrollIntoView.mockRestore()
  })
  test('does not re-scroll when the motion preference changes while the warning is visible', async () => {
    const scrollIntoView = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView')
    try {
      renderSheet()
      fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
      await screen.findByRole('dialog')
      await user.type(await screen.findByLabelText('Name'), 'test')
      await user.click(await screen.findByRole('radio', { name: /Organization/ }))
      fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
      fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))

      fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
      await screen.findByText('No permissions selected', { selector: '[role="alert"] *' })
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))

      mockUseReducedMotion.mockReturnValue(true)
      // Round-tripping the resource-access scope re-renders the form (resourceAccess is
      // watched at the top level) without touching missingPermissionsAttempts, so the
      // warning stays up — this is what would surface a stale effect dependency on the
      // motion preference.
      await user.click(await screen.findByRole('radio', { name: /Project/ }))
      await user.click(await screen.findByRole('radio', { name: /Organization/ }))
      await screen.findByText('No permissions selected', { selector: '[role="alert"] *' })
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
    } finally {
      mockUseReducedMotion.mockReturnValue(false)
      scrollIntoView.mockRestore()
    }
  })
  test('creates the token when scope is Organization', async () => {
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    await expandPermissionCategory('Project')
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'Read' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    // Review screen — Project Settings is a high-risk entry, downgraded one tier for read-only
    await screen.findByText('Medium risk')
    await screen.findByText('Read on 1 capability, across 1 organization.')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // If we can click this checkbox, the token was created
    // Must be a real click, which focuses the button: nothing holds focus once the form
    // unmounts, and copyToClipboard bails out when the document has no focus
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  }, 10_000)

  // Permission preset tests
  const FULL_ACCESS_WARNING =
    'Grants the highest access each resource offers, including write access to your database, API keys, and organization members.'

  const getPresetTrigger = async () => screen.findByRole('combobox', { name: 'Permission preset' })

  const openPresetMenu = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    fireEvent.click(await getPresetTrigger())
  }

  test('applies a preset to every permission row', async () => {
    renderSheet()
    await openPresetMenu()
    fireEvent.click(await screen.findByRole('option', { name: 'Read-only' }))

    expect((await getPresetTrigger()).textContent).toContain('Read-only')
    // The bulk change is announced rather than left to the user to notice
    expect((await screen.findByRole('status')).textContent).toBe('All permissions set to read')

    await expandPermissionCategory('Project')
    const select = await screen.findByLabelText('Project Settings', { exact: false })
    expect(select.textContent).toBe('Read')
  })

  test('warns about full access in the menu and inline once applied', async () => {
    renderSheet()
    await openPresetMenu()

    const fullAccess = await screen.findByRole('option', { name: /^Full access/ })
    const describedBy = fullAccess.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(describedBy!)?.textContent).toBe(FULL_ACCESS_WARNING)

    fireEvent.click(fullAccess)
    // The warning survives the menu closing
    await screen.findByText(FULL_ACCESS_WARNING, { selector: '[role="alert"] *' })
    expect((await getPresetTrigger()).textContent).toContain('Full access')
  })

  test('falls back to Custom when a row diverges from the preset', async () => {
    renderSheet()
    await openPresetMenu()
    fireEvent.click(await screen.findByRole('option', { name: /^Full access/ }))
    await screen.findByText(FULL_ACCESS_WARNING, { selector: '[role="alert"] *' })

    await expandPermissionCategory('Project')
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'None' }))

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
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    // Trigger a resource validation error before entering legacy mode
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
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
    renderSheet()
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByText('Create legacy token'))
    fireEvent.click(await screen.findByRole('button', { name: 'Generate token' }))
    // If we can click this button, the token was created
    // Must be a real click, which focuses the button: nothing holds focus once the form
    // unmounts, and copyToClipboard bails out when the document has no focus
    await user.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_classic_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
