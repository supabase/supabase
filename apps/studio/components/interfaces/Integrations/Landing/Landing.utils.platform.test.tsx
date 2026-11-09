import { PermissionAction } from '@supabase/shared-types/out/constants'
import { waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useProjectOAuthIntegrationData } from './Landing.utils'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

type AccessControlPermission = components['schemas']['AccessControlPermission']

const CAN_READ_OAUTH_APPS_PERMISSION: AccessControlPermission = {
  actions: [PermissionAction.READ],
  condition: null,
  organization_id: null,
  organization_slug: 'acme',
  project_ids: null,
  project_refs: [],
  resources: ['oauth_apps'],
  restrictive: false,
}

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const secretKey: ApiKeyResponse = {
  type: 'secret',
  name: 'default',
  api_key: 'sb_secret_abc',
  id: 'id',
  hash: 'hash',
  prefix: 'sb_secret_',
  inserted_at: '2024-01-01',
  secret_jwt_template: { role: 'service_role' },
}

const withoutKeysRead = (): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter(
        (permission) => permission !== FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ
      ),
      projects: [],
    },
  ],
})

const mockApiKeys = () => {
  const requests = vi.fn()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      requests()
      return HttpResponse.json<ApiKeyResponse[]>([secretKey])
    },
  })
  return requests
}

const mockOtherResources = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: () => HttpResponse.json<AccessControlPermission[]>([CAN_READ_OAUTH_APPS_PERMISSION]),
  })
  addAPIMock({ method: 'get', path: '/v1/projects/:ref/secrets', response: [] })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/partners/:ref',
    response: { integrations: [] },
  })
  addAPIMock({ method: 'get', path: '/platform/organizations/:slug/oauth/apps', response: [] })
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'forbidden' }, { status: 403 }),
  })
}

const renderData = () =>
  customRenderHook(() => useProjectOAuthIntegrationData('default'), {
    profileContext: createMockProfileContext(),
  })

describe('useProjectOAuthIntegrationData api keys', () => {
  it('returns the keys when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockApiKeys()
    mockOtherResources()

    const { result } = renderData()

    await waitFor(() => expect(result.current.data.apiKeys).toEqual([secretKey]))
  })

  it('settles with no keys and makes no request when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const requests = mockApiKeys()
    mockOtherResources()

    const { result } = renderData()

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.data.apiKeys).toEqual([])
    expect(result.current.isError).toBe(false)
    expect(requests).not.toHaveBeenCalled()
  })

  it('surfaces an error when the permission check fails', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    mockApiKeys()
    mockOtherResources()

    const { result } = renderData()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data.apiKeys).toEqual([])
  })
})
