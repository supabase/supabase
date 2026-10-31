import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { DeleteBranchPanel } from './DeleteBranchPanel'
import type { components } from '@/data/api'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import {
  BRANCH_TEST_SCOPE,
  createTestBranch,
  mockBranchProject,
  mockParentProjectPermissions,
} from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissions, mockPermissionsError } from '@/tests/lib/msw-permissions'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

mockAnimationsApi()

type BranchDeleteResponse = components['schemas']['BranchDeleteResponse_Output']

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
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BRANCH = createTestBranch({
  name: 'feature-x',
  parent_project_ref: BRANCH_TEST_SCOPE.parentRef,
  project_ref: BRANCH_TEST_SCOPE.branchRef,
})

function mockEndpoints() {
  mockBranchProject()
  addAPIMock({ method: 'get', path: '/v1/projects/:ref/branches', response: [BRANCH] })
}

const renderPanel = () =>
  customRender(<DeleteBranchPanel />, { profileContext: createMockProfileContext() })

const getDeleteButton = () => screen.findByRole('button', { name: 'Delete branch' })

describe('DeleteBranchPanel', () => {
  test('deletes the branch when the user can delete branches on the parent project', async () => {
    mockEndpoints()
    mockParentProjectPermissions([
      FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ,
      FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_DELETE,
    ])
    const deletedRefs: string[] = []
    addAPIMock({
      method: 'delete',
      path: '/v1/branches/:branch_id_or_ref',
      response: ({ params }) => {
        deletedRefs.push(params.branch_id_or_ref as string)
        return HttpResponse.json<BranchDeleteResponse>({ message: 'ok' })
      },
    })

    renderPanel()

    const deleteButton = await getDeleteButton()
    await waitFor(() => expect(deleteButton).not.toHaveAttribute('aria-disabled', 'true'))
    await userEvent.click(deleteButton)

    const dialog = within(await screen.findByRole('dialog'))
    fireEvent.change(dialog.getByPlaceholderText('Type in name of branch'), {
      target: { value: 'feature-x' },
    })
    fireEvent.click(dialog.getByRole('button', { name: 'Delete branch' }))

    await waitFor(() => expect(deletedRefs).toEqual([BRANCH_TEST_SCOPE.branchRef]))
  })

  test('disables deletion when the user lacks the permission', async () => {
    mockEndpoints()
    mockPermissions(NO_PERMISSIONS)

    renderPanel()

    const deleteButton = await getDeleteButton()
    await userEvent.hover(deleteButton)
    expect(
      await screen.findAllByText('You need additional permissions to delete this branch')
    ).not.toHaveLength(0)
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true')
  })

  test('disables deletion and explains why when permissions fail to load', async () => {
    mockEndpoints()
    mockPermissionsError({ message: 'Permissions service unavailable' })

    renderPanel()

    const deleteButton = await getDeleteButton()
    await userEvent.hover(deleteButton)
    expect(await screen.findAllByText('Failed to check permissions')).not.toHaveLength(0)
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true')
  })
})
