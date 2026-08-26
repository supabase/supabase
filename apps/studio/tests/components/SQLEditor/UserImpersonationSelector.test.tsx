import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UserImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector/UserImpersonationSelector'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/data/auth/users-infinite-query', () => ({
  useUsersInfiniteQuery: () => ({
    data: { pages: [{ result: [] }] },
    isSuccess: true,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    isPlaceholderData: false,
  }),
}))

vi.mock('@/hooks/misc/useCustomAccessTokenHookDetails', () => ({
  useCustomAccessTokenHookDetails: () => undefined,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'test-project', connectionString: 'postgresql://example' },
  }),
}))

describe('UserImpersonationSelector', () => {
  it('shows the external claims example and MFA guidance in the shared layout', async () => {
    const user = userEvent.setup()
    const state: RoleImpersonationController = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'native',
      },
      claims: undefined,
      setRole: vi.fn(),
    }

    customRender(<UserImpersonationSelector state={state} />)
    await user.click(screen.getByRole('radio', { name: 'External' }))

    expect(
      screen.getByPlaceholderText('e.g. {"app_metadata": {"org_id": "org_456"}}')
    ).toBeVisible()
    expect(screen.getByText('MFA level')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Users' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'MFA level' })).toBeVisible()
  })

  it('locks the user source and MFA level while impersonating a selected user', () => {
    const state: RoleImpersonationController = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: { sub: 'external-user', additionalClaims: {} },
        aal: 'aal2',
      },
      claims: undefined,
      setRole: vi.fn(),
    }

    customRender(<UserImpersonationSelector state={state} />)

    expect(screen.getByRole('radio', { name: 'Project' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'External' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'AAL1' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'AAL2' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'AAL2' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
  })
})
