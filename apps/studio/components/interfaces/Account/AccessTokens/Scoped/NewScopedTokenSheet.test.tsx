import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { NewScopedTokenSheet } from './NewScopedTokenSheet'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse, createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type ProjectsResponse = components['schemas']['ListProjectsPaginatedResponse']
type CreateTokenResponse = components['schemas']['CreateScopedAccessTokenResponse']

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

describe('NewScopedTokenSheet', () => {
  beforeEach(() => {
    mockOrganizations()
    mockProjects()
    mockCreateToken()
  })
  test('requires a token name', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please enter a name for the token'))
  })
  // Project scope tests
  test('requires an organization when scope is Project', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select an organization to continue.'))
  })
  test('requires a project when scope is Project', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select a project to continue.'))
  })
  test('requires permissions when scope is Project', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
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
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Project 1' }))
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'Read' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    // Review screen
    await screen.findByText('Low — single-project read-only access')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // If we can click this checkbox, the token was created
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  // Organization scope tests
  test('requires an organization when scope is Organization', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('Please select an organization to continue.'))
  })
  test('requires permissions when scope is Organization', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('No permissions selected', { selector: '[role="alert"] *' }))
  })
  test('creates the token when scope is Organization', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Acme Production' }))
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'Read' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    // Review screen
    await screen.findByText('Low — organization-wide read-only access')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // If we can click this checkbox, the token was created
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  // Account scope tests
  test('requires permissions when scope is Account', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByText('Advanced options'))
    await user.click(
      await screen.findByText(
        'I understand this token is not limited to one project or organization.'
      )
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    expect(await screen.findByText('No permissions selected', { selector: '[role="alert"] *' }))
  })
  test('creates the token when scope is Account', async () => {
    customRender(<NewScopedTokenSheet />, { profileContext: PROFILE_CONTEXT })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.type(await screen.findByLabelText('Name'), 'test')
    await user.click(await screen.findByText('Advanced options'))
    await user.click(
      await screen.findByText(
        'I understand this token is not limited to one project or organization.'
      )
    )
    fireEvent.click(await screen.findByLabelText('Project Settings', { exact: false }))
    fireEvent.click(await screen.findByRole('option', { name: 'Read' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Review access' }))
    // Review screen
    await screen.findByText('Elevated — account-wide read-only access')
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }))
    // If we can click this checkbox, the token was created
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }))
    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toEqual('a_token_value')
    )
    fireEvent.click(await screen.findByLabelText('I have copied the key and stored it securely'))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    // Dialog has been closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
