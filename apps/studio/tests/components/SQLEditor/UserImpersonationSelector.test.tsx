import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector/UserImpersonationSelector'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import type { User } from '@/data/auth/users-infinite-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.default.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const AUTH_CONFIG_WITHOUT_CUSTOM_ACCESS_TOKEN_HOOK = {
  HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: false,
  HOOK_CUSTOM_ACCESS_TOKEN_SECRETS: '',
  HOOK_CUSTOM_ACCESS_TOKEN_URI: '',
} as unknown as AuthConfigResponse

describe('UserImpersonationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: PROJECT,
    })
    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: () =>
        HttpResponse.json<AuthConfigResponse>(AUTH_CONFIG_WITHOUT_CUSTOM_ACCESS_TOKEN_HOOK),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<User[]>([]),
    })
  })

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

  it('clears the selected user when switching user sources', async () => {
    const user = userEvent.setup()
    const onUserImpersonationCleared = vi.fn()
    const state: RoleImpersonationController = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: { sub: 'external-user', additionalClaims: {} },
        aal: 'aal2',
      },
      claims: undefined,
      setRole: vi.fn().mockResolvedValue(undefined),
    }

    customRender(
      <UserImpersonationSelector
        state={state}
        onUserImpersonationCleared={onUserImpersonationCleared}
      />
    )

    expect(screen.getByRole('radio', { name: 'Project' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'External' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Stop impersonating user' })).toBeEnabled()

    await user.click(screen.getByRole('radio', { name: 'Project' }))

    expect(state.setRole).toHaveBeenCalledWith(undefined)
    expect(onUserImpersonationCleared).toHaveBeenCalledOnce()
  })

  it('updates the active impersonation when switching MFA levels', async () => {
    const user = userEvent.setup()
    const state: RoleImpersonationController = {
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
        externalAuth: { sub: 'external-user', additionalClaims: {} },
        aal: 'aal2',
      },
      claims: undefined,
      setRole: vi.fn().mockResolvedValue(undefined),
    }

    customRender(<UserImpersonationSelector state={state} />)

    expect(screen.getByRole('radio', { name: 'AAL1' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'AAL2' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'AAL2' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'AAL1' }))

    expect(state.setRole).toHaveBeenCalledWith(
      expect.objectContaining({
        aal: 'aal1',
        externalAuth: { sub: 'external-user', additionalClaims: {} },
      }),
      undefined
    )
  })
})
