import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  MOCK_ORG,
  MOCK_ORG_2,
  MOCK_PROJECT,
  MOCK_PROJECT_2,
  mockPermissionsApi,
  mockScopedTokenEnvironment,
  readonlyRows,
} from '../../AccessToken.fixtures'
import { NewScopedTokenSheet } from '../NewScopedTokenSheet'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse']

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

describe('ResourceAccessStep project selector', () => {
  beforeEach(() => {
    mockScopedTokenEnvironment()
  })

  const openTokenForm = async () => {
    customRender(<NewScopedTokenSheet onCreateExperimentalToken={() => {}} />, {
      profileContext: createMockProfileContext(),
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Generate new token' }))
    await screen.findByRole('dialog')
  }

  const selectOrganization = async (name: string) => {
    fireEvent.click(await screen.findByRole('combobox', { name: 'Organization' }))
    fireEvent.click(await screen.findByRole('option', { name }))
  }

  test('loads projects scoped to the selected organization', async () => {
    mockPermissionsApi(readonlyRows(MOCK_ORG.slug))
    await openTokenForm()
    await selectOrganization(MOCK_ORG.name)

    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    expect(await screen.findByRole('option', { name: MOCK_PROJECT.name })).toBeInTheDocument()
  })

  // Regression test: the project list used to be fetched cross-org (a single page of the user's
  // first 100 projects, filtered client-side by org), so switching to an org whose projects
  // didn't fall in that page left the selector permanently empty.
  test('refreshes the project list when switching organizations', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<OrganizationResponse[]>([
          createMockOrganizationResponse({ slug: MOCK_ORG.slug, name: MOCK_ORG.name }),
          createMockOrganizationResponse({ slug: MOCK_ORG_2.slug, name: MOCK_ORG_2.name }),
        ]),
    })
    mockPermissionsApi([...readonlyRows(MOCK_ORG.slug), ...readonlyRows(MOCK_ORG_2.slug)])

    await openTokenForm()
    await selectOrganization(MOCK_ORG.name)
    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    expect(await screen.findByRole('option', { name: MOCK_PROJECT.name })).toBeInTheDocument()

    await selectOrganization(MOCK_ORG_2.name)
    fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
    expect(await screen.findByRole('option', { name: MOCK_PROJECT_2.name })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: MOCK_PROJECT.name })).toBeNull()
  })
})
