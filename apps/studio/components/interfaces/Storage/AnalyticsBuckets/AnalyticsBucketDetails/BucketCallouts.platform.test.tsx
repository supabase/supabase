import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { WrapperMissing } from './BucketCallouts'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRender } from '@/tests/lib/custom-render'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

vi.mock('./SimpleConfigurationDetails', () => ({ SimpleConfigurationDetails: () => null }))

const withoutSecretKeys = (): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter(
        (permission) => permission !== FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_SECRET_READ
      ),
      projects: [],
    },
  ],
})

const renderCallout = () =>
  customRender(<WrapperMissing bucketName="bucket" />, {
    profileContext: createMockProfileContext(),
  })

describe('WrapperMissing', () => {
  it('enables installing the wrapper when the user can read secret keys', async () => {
    mockProjectGrantContext({ ref: 'default' })

    renderCallout()

    const button = await screen.findByRole('button', { name: 'Install wrapper' })
    await waitFor(() => expect(button).toBeEnabled())
    expect(screen.queryByText(/need additional permissions/)).not.toBeInTheDocument()
  })

  it('disables installing the wrapper and explains why when secret keys are not readable', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutSecretKeys() })

    renderCallout()

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Install wrapper' })).toBeDisabled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    renderCallout()

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Install wrapper' })).toBeDisabled()
  })
})
