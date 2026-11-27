import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { CreateBranchButton } from './CreateBranchButton'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import {
  BRANCH_TEST_SCOPE,
  mockBranchProject,
  mockParentProjectPermissions,
} from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
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

const renderButton = () =>
  customRender(<CreateBranchButton />, { profileContext: createMockProfileContext() })

const getCreateButton = () => screen.findByRole('button', { name: 'Create branch' })

describe('CreateBranchButton', () => {
  test('is enabled when the user can create branches on the parent project', async () => {
    mockBranchProject()
    mockParentProjectPermissions([FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_CREATE])

    renderButton()

    const createButton = await getCreateButton()
    await waitFor(() => expect(createButton).toBeEnabled())
  })

  test('is disabled with an explanation when the user lacks the permission', async () => {
    mockBranchProject()
    mockPermissions(NO_PERMISSIONS)

    renderButton()

    const createButton = await getCreateButton()
    await userEvent.hover(createButton)
    expect(
      await screen.findAllByText('You need additional permissions to create branches')
    ).not.toHaveLength(0)
    expect(createButton).toHaveAttribute('aria-disabled', 'true')
  })

  test('is disabled with the error when permissions fail to load', async () => {
    mockBranchProject()
    mockPermissionsError({ message: 'Permissions service unavailable' })

    renderButton()

    const createButton = await getCreateButton()
    await userEvent.hover(createButton)
    expect(await screen.findAllByText('Failed to check permissions')).not.toHaveLength(0)
    expect(createButton).toHaveAttribute('aria-disabled', 'true')
  })
})
