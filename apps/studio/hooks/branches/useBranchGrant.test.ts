// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { useBranchGrant } from './useBranchGrant'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import {
  BRANCH_TEST_SCOPE,
  mockBranchProject,
  mockParentProjectPermissions,
} from '@/tests/lib/branch-test-utils'
import { customRenderHook } from '@/tests/lib/custom-render'
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

const UPDATE_BRANCH = 'PATCH /v1/branches/{branch_id_or_ref}'

const renderBranchGrant = (isDefault: boolean | undefined) =>
  customRenderHook(
    () => useBranchGrant(UPDATE_BRANCH, { projectRef: BRANCH_TEST_SCOPE.parentRef, isDefault }),
    { profileContext: createMockProfileContext() }
  )

describe('useBranchGrant', () => {
  test('grants a preview branch with development permissions only', async () => {
    mockBranchProject()
    mockParentProjectPermissions([FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE])

    const { result } = renderBranchGrant(false)

    await waitFor(() => expect(result.current.status).toBe('granted'))
    expect(result.current.grant?.variant).toBe('development')
  })

  test('denies the default branch without production permissions', async () => {
    mockBranchProject()
    mockParentProjectPermissions([FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE])

    const { result } = renderBranchGrant(true)

    await waitFor(() => expect(result.current.status).toBe('denied'))
  })

  test('grants the default branch with production permissions', async () => {
    mockBranchProject()
    mockParentProjectPermissions([FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE])

    const { result } = renderBranchGrant(true)

    await waitFor(() => expect(result.current.status).toBe('granted'))
    expect(result.current.grant?.variant).toBe('production')
  })
})
