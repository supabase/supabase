import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useIcebergWrapperCreateMutation } from './iceberg-wrapper-create-mutation'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

const permissionsWithout = (denied: string): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter((permission) => permission !== denied),
      projects: [],
    },
  ],
})

const renderMutation = () =>
  customRenderHook(() => useIcebergWrapperCreateMutation(), {
    profileContext: createMockProfileContext(),
  })

const secretKey = {
  type: 'secret' as const,
  name: 'default',
  api_key: 'sb_secret_abc',
  id: 'id',
  hash: 'hash',
  prefix: 'sb_secret_',
  inserted_at: '2024-01-01',
  secret_jwt_template: { role: 'service_role' },
}

const mockS3Credentials = (requests: () => void) =>
  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/credentials',
    response: () => {
      requests()
      return HttpResponse.json<APIErrorBody>({ message: 'unexpected request' }, { status: 500 })
    },
  })

describe('useIcebergWrapperCreateMutation', () => {
  it('is ready once a secret key has been revealed', async () => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: [secretKey],
    })

    const { result } = renderMutation()

    await waitFor(() => expect(result.current.isApiKeyReady).toBe(true))
  })

  it('refuses to create anything when the API keys request fails', async () => {
    const s3KeyRequests = vi.fn()
    mockProjectGrantContext({ ref: 'default' })
    mockS3Credentials(s3KeyRequests)
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'boom' }, { status: 500 }),
    })

    const { result } = renderMutation()

    await waitFor(() => expect(result.current.apiKeyState).toBe('error'))
    expect(result.current.isApiKeyReady).toBe(false)
    await expect(result.current.mutateAsync({ bucketName: 'bucket' })).rejects.toThrow(
      'Unable to load a secret API key'
    )
    expect(s3KeyRequests).not.toHaveBeenCalled()
  })

  it('refuses to create anything when no secret or service key is returned', async () => {
    const s3KeyRequests = vi.fn()
    mockProjectGrantContext({ ref: 'default' })
    mockS3Credentials(s3KeyRequests)
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: [],
    })

    const { result } = renderMutation()

    await waitFor(() => expect(result.current.apiKeyState).toBe('missing'))
    expect(result.current.isApiKeyReady).toBe(false)
    await expect(result.current.mutateAsync({ bucketName: 'bucket' })).rejects.toThrow(
      'Unable to load a secret API key'
    )
    expect(s3KeyRequests).not.toHaveBeenCalled()
  })

  it('refuses to create the wrapper without access to secret API keys', async () => {
    const s3KeyRequests = vi.fn()
    mockProjectGrantContext({
      ref: 'default',
      permissions: permissionsWithout(FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_SECRET_READ),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/credentials',
      response: () => {
        s3KeyRequests()
        return HttpResponse.json<APIErrorBody>({ message: 'unexpected request' }, { status: 500 })
      },
    })

    const { result } = renderMutation()

    await waitFor(() => expect(result.current.apiKeysGrant.status).toBe('denied'))
    await expect(result.current.mutateAsync({ bucketName: 'bucket' })).rejects.toThrow(
      'You need additional permissions to view API keys'
    )
    expect(s3KeyRequests).not.toHaveBeenCalled()
  })

  it('exposes a granted grant when the user can read secret keys', async () => {
    mockProjectGrantContext({ ref: 'default' })

    const { result } = renderMutation()

    await waitFor(() => expect(result.current.apiKeysGrant.status).toBe('granted'))
  })
})
