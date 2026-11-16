import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import JWTSigningKeysPage from '@/pages/project/[ref]/settings/jwt/index'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

vi.mock('@/components/layouts/DefaultLayout', () => ({
  DefaultLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/JWTKeys/JWTKeysLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/JwtSecrets/jwt-secret-keys-table', () => ({
  JWTSecretKeysTable: () => <div>JWTSecretKeysTable</div>,
}))

describe('/project/[ref]/settings/jwt grants', () => {
  it('renders the keys table when the grant is held', async () => {
    mockProjectGrantContext({ ref: 'default' })

    render(<JWTSigningKeysPage dehydratedState={{}} />, {
      profileContext: createMockProfileContext(),
    })

    expect(await screen.findByText('JWTSecretKeysTable')).toBeInTheDocument()
  })

  it('shows a no-permission message when the grant is denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })

    render(<JWTSigningKeysPage dehydratedState={{}} />, {
      profileContext: createMockProfileContext(),
    })

    expect(await screen.findByText(/need additional permissions/)).toBeVisible()
    expect(screen.queryByText('JWTSecretKeysTable')).not.toBeInTheDocument()
  })

  it('denies when only unrelated permissions are held', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: {
        organizations: [
          {
            slug: 'acme',
            role: 'owner',
            permissions: ALL_FGA_PERMISSIONS.filter((p) => !p.startsWith('auth_signing_keys_')),
            projects: [],
          },
        ],
      },
    })

    render(<JWTSigningKeysPage dehydratedState={{}} />, {
      profileContext: createMockProfileContext(),
    })

    expect(await screen.findByText(/need additional permissions/)).toBeVisible()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    render(<JWTSigningKeysPage dehydratedState={{}} />, {
      profileContext: createMockProfileContext(),
    })

    expect(await screen.findByText(/Failed to check JWT signing keys permissions/)).toBeVisible()
  })
})
