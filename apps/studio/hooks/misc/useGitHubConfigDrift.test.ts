// @vitest-environment jsdom
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { getGitBranchName, useSelectedGitHubConfigDrift } from './useGitHubConfigDrift'
import type { Branch } from '@/data/branches/branches-query'
import { BRANCH_TEST_SCOPE, mockBranchProject } from '@/tests/lib/branch-test-utils'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissions, mockPermissionsError } from '@/tests/lib/msw-permissions'
import {
  allPermissionsFor,
  NO_PERMISSIONS,
  type PermissionsV2Response,
} from '@/tests/lib/permissions-fixtures'
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

function branch(overrides: Partial<Branch>): Branch {
  return {
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    id: 'branch-id',
    is_default: false,
    name: 'feature/foo',
    parent_project_ref: 'parent-ref',
    persistent: false,
    project_ref: 'project-ref',
    status: 'MIGRATIONS_PASSED',
    with_data: false,
    ...overrides,
  }
}

describe('getGitBranchName', () => {
  it('returns undefined when there is no branch', () => {
    expect(getGitBranchName(undefined)).toBeUndefined()
  })

  it('prefers the trimmed git_branch when set', () => {
    expect(getGitBranchName(branch({ git_branch: '  main  ', name: 'feature/foo' }))).toBe('main')
  })

  it('falls back to the trimmed branch name when git_branch is unset', () => {
    expect(getGitBranchName(branch({ git_branch: undefined, name: '  feature/foo  ' }))).toBe(
      'feature/foo'
    )
  })

  it('falls back to the branch name when git_branch is blank', () => {
    expect(getGitBranchName(branch({ git_branch: '   ', name: 'feature/foo' }))).toBe('feature/foo')
  })

  it('returns undefined for the default branch when git_branch is unset', () => {
    expect(getGitBranchName(branch({ git_branch: undefined, is_default: true }))).toBeUndefined()
  })

  it('still prefers git_branch for the default branch when it is set', () => {
    expect(getGitBranchName(branch({ git_branch: 'main', is_default: true }))).toBe('main')
  })
})

function mockGitHubConnection() {
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/connections',
    response: {
      connections: [
        {
          id: 1,
          inserted_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          branch_limit: 50,
          installation_id: 1,
          new_branch_per_pr: true,
          supabase_changes_only: true,
          workdir: 'supabase',
          project: { id: 1, name: 'Production', ref: BRANCH_TEST_SCOPE.parentRef },
          repository: { id: 1, name: 'acme/app' },
          user: null,
        },
      ],
    },
  })
}

describe('useSelectedGitHubConfigDrift', () => {
  it('settles as permission denied instead of staying pending without branch access', async () => {
    mockBranchProject()
    mockPermissions(NO_PERMISSIONS)
    mockGitHubConnection()

    const { result } = customRenderHook(() => useSelectedGitHubConfigDrift(), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() => expect(result.current.isPermissionDenied).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(result.current.isReady).toBe(false)
  })

  it('surfaces a permissions error instead of staying pending', async () => {
    mockBranchProject()
    mockPermissionsError({ message: 'Permissions service unavailable' })
    mockGitHubConnection()

    const { result } = customRenderHook(() => useSelectedGitHubConfigDrift(), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(result.current.error?.message).toBe('Permissions service unavailable')
  })

  it('reloads branches and both configs once a refreshed permissions request succeeds', async () => {
    mockBranchProject()
    let permissionsAvailable = false
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions/v2',
      response: () => {
        if (permissionsAvailable) {
          return HttpResponse.json<PermissionsV2Response>(
            allPermissionsFor([BRANCH_TEST_SCOPE.organizationSlug])
          )
        }
        return HttpResponse.json<APIErrorBody>(
          { message: 'Permissions service unavailable' },
          { status: 500 }
        )
      },
    })
    mockGitHubConnection()
    const requested = { branches: vi.fn(), projectConfig: vi.fn(), githubConfig: vi.fn() }
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () => {
        requested.branches()
        return HttpResponse.json<Branch[]>([
          branch({ project_ref: BRANCH_TEST_SCOPE.branchRef, git_branch: 'feature' }),
        ])
      },
    })
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/config',
      response: () => {
        requested.projectConfig()
        return HttpResponse.json<APIErrorBody>({ message: 'Not needed' }, { status: 500 })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/integrations/github/connections/:connection_id/config',
      response: () => {
        requested.githubConfig()
        return HttpResponse.json<APIErrorBody>({ message: 'Not needed' }, { status: 500 })
      },
    })

    const { result } = customRenderHook(() => useSelectedGitHubConfigDrift(), {
      profileContext: createMockProfileContext(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(requested.branches).not.toHaveBeenCalled()

    permissionsAvailable = true
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => expect(requested.branches).toHaveBeenCalled())
    await waitFor(() => expect(requested.projectConfig).toHaveBeenCalled())
    await waitFor(() => expect(requested.githubConfig).toHaveBeenCalled())
  })
})
