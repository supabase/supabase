import { QueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { createJWTSigningKey } from './jwt-signing-key-create-mutation'
import { deleteJWTSigningKey } from './jwt-signing-key-delete-mutation'
import { updateJWTSigningKey } from './jwt-signing-key-update-mutation'
import { jwtSigningKeysQueryOptions } from './jwt-signing-keys-query'
import { createLegacyJWTSigningKey } from './legacy-jwt-signing-key-create-mutation'
import { legacyJWTSigningKeyQueryOptions } from './legacy-jwt-signing-key-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

const projectRef = 'proj'
type SigningKey = components['schemas']['SigningKeyResponse_Output']

const KEY: SigningKey = {
  id: 'key-1',
  algorithm: 'ES256',
  status: 'in_use',
  public_jwk: {},
  created_at: '2025-02-16T22:24:42.115195Z',
  updated_at: '2025-02-16T22:24:42.115195Z',
}

describe('jwt signing keys queries', () => {
  it('lists keys through the guarded client', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys',
      response: { keys: [KEY] },
    })
    const grant = testGrant('GET /v1/projects/{ref}/config/auth/signing-keys', { projectRef })

    const data = await new QueryClient().fetchQuery(
      jwtSigningKeysQueryOptions({ projectRef, grant })
    )

    expect(data.keys).toHaveLength(1)
  })

  it('fetches the legacy key through the guarded client', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
      response: KEY,
    })
    const grant = testGrant('GET /v1/projects/{ref}/config/auth/signing-keys/legacy', {
      projectRef,
    })

    const data = await new QueryClient().fetchQuery(
      legacyJWTSigningKeyQueryOptions({ projectRef, grant })
    )

    expect(data?.id).toBe('key-1')
  })

  it('resolves the legacy key to null when the secret has not been migrated (404)', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
      response: () =>
        HttpResponse.json<APIErrorBody>(
          { message: 'Legacy JWT secret has not been imported as signing key for this project' },
          { status: 404 }
        ),
    })
    const grant = testGrant('GET /v1/projects/{ref}/config/auth/signing-keys/legacy', {
      projectRef,
    })

    const data = await new QueryClient().fetchQuery(
      legacyJWTSigningKeyQueryOptions({ projectRef, grant })
    )

    expect(data).toBeNull()
  })

  it('rejects the legacy key query on other errors (500)', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })
    const grant = testGrant('GET /v1/projects/{ref}/config/auth/signing-keys/legacy', {
      projectRef,
    })

    await expect(
      new QueryClient().fetchQuery(legacyJWTSigningKeyQueryOptions({ projectRef, grant }))
    ).rejects.toThrow()
  })

  it('stays disabled without a grant', () => {
    expect(jwtSigningKeysQueryOptions({ projectRef }).enabled).toBe(false)
    expect(legacyJWTSigningKeyQueryOptions({ projectRef }).enabled).toBe(false)
  })
})

describe('jwt signing keys mutations', () => {
  it('creates a key', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/config/auth/signing-keys',
      response: async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json<SigningKey>(KEY)
      },
    })

    await createJWTSigningKey({
      projectRef,
      grant: testGrant('POST /v1/projects/{ref}/config/auth/signing-keys', { projectRef }),
      algorithm: 'ES256',
      status: 'standby',
      private_jwk: undefined,
    })

    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ status: 'standby' }))
  })

  it('updates a key', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'patch',
      path: '/v1/projects/:ref/config/auth/signing-keys/:id',
      response: async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json<SigningKey>(KEY)
      },
    })

    await updateJWTSigningKey({
      projectRef,
      grant: testGrant('PATCH /v1/projects/{ref}/config/auth/signing-keys/{id}', { projectRef }),
      keyId: 'key-1',
      status: 'revoked',
    })

    expect(onRequest).toHaveBeenCalledWith({ status: 'revoked' })
  })

  it('deletes a key', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'delete',
      path: '/v1/projects/:ref/config/auth/signing-keys/:id',
      response: () => {
        onRequest()
        return HttpResponse.json<SigningKey>(KEY)
      },
    })

    await deleteJWTSigningKey({
      projectRef,
      grant: testGrant('DELETE /v1/projects/{ref}/config/auth/signing-keys/{id}', { projectRef }),
      keyId: 'key-1',
    })

    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('migrates the legacy secret', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
      response: () => {
        onRequest()
        return HttpResponse.json<SigningKey>(KEY)
      },
    })

    await createLegacyJWTSigningKey({
      projectRef,
      grant: testGrant('POST /v1/projects/{ref}/config/auth/signing-keys/legacy', { projectRef }),
    })

    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('requires a project ref', async () => {
    await expect(
      deleteJWTSigningKey({
        keyId: 'key-1',
        grant: testGrant('DELETE /v1/projects/{ref}/config/auth/signing-keys/{id}'),
      })
    ).rejects.toThrow('projectRef is required')
  })
})
