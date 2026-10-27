import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { GitHubIntegrationConnectionForm } from './GitHubIntegrationConnectionForm'
import type { GitHubConnection } from '@/data/integrations/integrations.types'
import { FGA_PERMISSIONS, type FgaPermissions } from '@/hooks/misc/useCheckPermissionsV2'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { createTestBranch } from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissions } from '@/tests/lib/msw-permissions'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const ORGANIZATION_SLUG = 'acme'
const PROJECT_REF = 'project-ref'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: PROJECT_REF }),
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

const CONNECTION: GitHubConnection = {
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  branch_limit: 50,
  installation_id: 1,
  new_branch_per_pr: true,
  supabase_changes_only: true,
  workdir: 'supabase',
  project: { id: 1, name: 'Production', ref: PROJECT_REF },
  repository: { id: 1, name: 'acme/app' },
  user: null,
}

const PRODUCTION_BRANCH = createTestBranch({
  name: 'main',
  is_default: true,
  git_branch: 'main',
  parent_project_ref: PROJECT_REF,
  project_ref: PROJECT_REF,
})

function mockEndpoints(projectPermissions: FgaPermissions[]) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      connectionString: null,
      db_host: `db.${PROJECT_REF}.supabase.co`,
      dbVersion: 'supabase-postgres-15.1.0',
      high_availability: false,
      id: 1,
      infra_compute_size: 'micro',
      inserted_at: '2026-01-01T00:00:00.000Z',
      integration_source: null,
      is_branch_enabled: true,
      is_physical_backups_enabled: false,
      name: 'Production',
      organization_id: 1,
      ref: PROJECT_REF,
      region: 'us-east-1',
      restUrl: `https://${PROJECT_REF}.supabase.co`,
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/authorization',
    response: { id: 1, sender_id: 1, user_id: 1 },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [createMockOrganizationResponse({ id: 1, slug: ORGANIZATION_SLUG })],
  })
  mockPermissions({
    organizations: [
      {
        slug: ORGANIZATION_SLUG,
        role: 'developer',
        permissions: [FGA_PERMISSIONS.ORGANIZATION.CONFIG_WRITE],
        projects: [{ ref: PROJECT_REF, role: 'developer', permissions: projectPermissions }],
      },
    ],
  })
  addAPIMock({ method: 'get', path: '/v1/projects/:ref/branches', response: [PRODUCTION_BRANCH] })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/repositories',
    response: {
      partial_response_due_to_sso: false,
      repositories: [{ id: 1, installation_id: 1, name: 'acme/app', default_branch: 'main' }],
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: {
      entitlements: (['integrations.github_connections', 'branching_limit'] as const).map(
        (key) => ({
          config: { enabled: true },
          feature: { key, type: 'boolean' as const },
          hasAccess: true,
          type: 'boolean' as const,
        })
      ),
    },
  })
  addAPIMock({ method: 'get', path: '/platform/organizations/:slug/members', response: [] })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/members/invitations',
    response: { invitations: [] },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/roles',
    response: { org_scoped_roles: [], project_scoped_roles: [] },
  })
}

const renderForm = () =>
  customRender(<GitHubIntegrationConnectionForm connection={CONNECTION} />, {
    profileContext: createMockProfileContext(),
  })

async function editWorkingDirectory() {
  await waitFor(() => expect(screen.getByLabelText('Production branch name')).toHaveValue('main'))
  await userEvent.type(screen.getByLabelText('Working directory'), '/app')
}

describe('GitHubIntegrationConnectionForm', () => {
  test('blocks saving when the user cannot update the production branch', async () => {
    mockEndpoints([FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ])

    renderForm()

    await editWorkingDirectory()

    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    expect(saveButton).toHaveAttribute('aria-disabled', 'true')
    await userEvent.hover(saveButton)
    expect(
      await screen.findAllByText('You need additional permissions to update the production branch')
    ).not.toHaveLength(0)
  })

  test('allows saving with permission to update the production branch', async () => {
    mockEndpoints([
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
    ])

    renderForm()

    await editWorkingDirectory()

    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await waitFor(() => expect(saveButton).toBeEnabled())
  })

  test('blocks saving until the branch list loads, so it never creates a second production branch', async () => {
    mockEndpoints([
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_CREATE,
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
    ])
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Failed to list branches' }, { status: 500 }),
    })

    renderForm()

    await userEvent.type(await screen.findByLabelText('Working directory'), '/app')
    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await userEvent.hover(saveButton)
    expect(await screen.findAllByText('Failed to load branches')).not.toHaveLength(0)
    expect(saveButton).toHaveAttribute('aria-disabled', 'true')
  })

  test('keeps saving blocked while the branch list is still loading', async () => {
    mockEndpoints([
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_CREATE,
      FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
    ])
    let resolveBranches: () => void = () => {}
    const branchesLoaded = new Promise<void>((resolve) => {
      resolveBranches = resolve
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: async () => {
        await branchesLoaded
        return HttpResponse.json<(typeof PRODUCTION_BRANCH)[]>([PRODUCTION_BRANCH])
      },
    })

    renderForm()

    const workingDirectory = await screen.findByLabelText('Working directory')
    await waitFor(() => expect(workingDirectory).toBeEnabled())
    await userEvent.type(workingDirectory, '/app')
    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    expect(saveButton).toBeDisabled()

    resolveBranches()
    await editWorkingDirectory()

    await waitFor(() => expect(saveButton).toBeEnabled())
  })
})
