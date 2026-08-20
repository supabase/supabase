import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  MOCK_ORG,
  MOCK_PROJECT,
  mockPermissionsApi,
  mockScopedTokenEnvironment,
  readonlyRows,
} from '../../AccessToken.fixtures'
import { NewScopedTokenSheet } from '../NewScopedTokenSheet'
import { customRender } from '@/tests/lib/custom-render'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

// Disabling orgs for project-scoped members reads /platform/profile/permissions, which only
// fires on the platform for a logged-in user — neither is true in the default test environment.
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useIsLoggedIn: () => true }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const user = userEvent.setup()

describe('ResourceAccessStep organization selector', () => {
  beforeEach(() => {
    mockScopedTokenEnvironment()
  })

  const openOrganizationSelector = async () => {
    customRender(<NewScopedTokenSheet onCreateExperimentalToken={() => {}} />, {
      profileContext: createMockProfileContext(),
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
    await user.click(await screen.findByRole('radio', { name: /Organization/ }))
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organizations' }))
  }

  test('disables organizations where the user only has project-level access', async () => {
    mockPermissionsApi(readonlyRows(MOCK_ORG.slug, [MOCK_PROJECT.ref]))
    await openOrganizationSelector()

    const option = await screen.findByRole('option', { name: new RegExp(MOCK_ORG.name) })
    expect(option).toHaveAttribute('aria-disabled', 'true')
    expect(
      await screen.findByText(
        'Your access is limited to specific projects. Create a project-scoped token instead.'
      )
    ).toBeInTheDocument()
  })

  test('keeps organizations selectable for members with org-wide access', async () => {
    mockPermissionsApi(readonlyRows(MOCK_ORG.slug))
    await openOrganizationSelector()

    const option = await screen.findByRole('option', { name: new RegExp(MOCK_ORG.name) })
    expect(option).not.toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.queryByText(
        'Your access is limited to specific projects. Create a project-scoped token instead.'
      )
    ).toBeNull()
  })
})
