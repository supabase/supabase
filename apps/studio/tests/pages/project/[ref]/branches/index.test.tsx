import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import type { components } from '@/data/api'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import BranchesPage from '@/pages/project/[ref]/branches'
import {
  BRANCH_TEST_SCOPE,
  createTestBranch,
  mockBranchProject,
  mockParentProjectPermissions,
} from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissions, mockPermissionsError } from '@/tests/lib/msw-permissions'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: BRANCH_TEST_SCOPE.branchRef }),
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: {}, pathname: '/project/[ref]/branches' }),
}))

const MAIN_BRANCH = createTestBranch({
  id: 'main-branch-id',
  name: 'main',
  is_default: true,
  parent_project_ref: BRANCH_TEST_SCOPE.parentRef,
  project_ref: BRANCH_TEST_SCOPE.parentRef,
})
const PREVIEW_BRANCH = createTestBranch({
  name: 'feature-x',
  parent_project_ref: BRANCH_TEST_SCOPE.parentRef,
  project_ref: BRANCH_TEST_SCOPE.branchRef,
})

const PREVIEW_BRANCH_DETAIL: components['schemas']['BranchDetailResponse_Output'] = {
  ref: BRANCH_TEST_SCOPE.branchRef,
  postgres_version: '15.1.0',
  postgres_engine: '15',
  release_channel: 'ga',
  status: 'ACTIVE_HEALTHY',
  db_host: `db.${BRANCH_TEST_SCOPE.branchRef}.supabase.co`,
  db_port: 5432,
}

function mockEndpoints() {
  mockBranchProject()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/branches',
    response: [MAIN_BRANCH, PREVIEW_BRANCH],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/connections',
    response: { connections: [] },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/authorization',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/branches/:branch_id_or_ref',
    response: PREVIEW_BRANCH_DETAIL,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: { entitlements: [] },
  })
}

const renderPage = () =>
  customRender(<BranchesPage dehydratedState={{}} />, {
    profileContext: createMockProfileContext(),
  })

describe('BranchesPage', () => {
  test('lists the branches when the user can read branches on the parent project', async () => {
    mockEndpoints()
    mockParentProjectPermissions([FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ])

    renderPage()

    expect(await screen.findByText('feature-x')).toBeInTheDocument()
    expect(screen.queryByText(/You need additional permissions/)).not.toBeInTheDocument()
  })

  test('shows a no-permission state when the user cannot read branches', async () => {
    mockEndpoints()
    mockPermissions(NO_PERMISSIONS)

    renderPage()

    expect(
      await screen.findByText(/You need additional permissions to view this project's branches/)
    ).toBeInTheDocument()
    expect(screen.queryByText('feature-x')).not.toBeInTheDocument()
  })

  test('shows the error when permissions fail to load', async () => {
    mockEndpoints()
    mockPermissionsError({ message: 'Permissions service unavailable' })

    renderPage()

    expect(
      await screen.findByText('Failed to check your permissions to view branches')
    ).toBeInTheDocument()
    expect(screen.queryByText('feature-x')).not.toBeInTheDocument()
  })
})
