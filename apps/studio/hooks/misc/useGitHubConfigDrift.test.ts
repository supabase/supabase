// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getGitBranchName, useSelectedGitHubConfigDrift } from './useGitHubConfigDrift'
import type { Branch } from '@/data/branches/branches-query'
import { BRANCH_TEST_SCOPE, mockBranchProject } from '@/tests/lib/branch-test-utils'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
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
})
