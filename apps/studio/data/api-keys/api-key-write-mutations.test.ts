import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { createAPIKey } from './api-key-create-mutation'
import { deleteAPIKey } from './api-key-delete-mutation'
import { addAPIMock } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const key: ApiKeyResponse = {
  id: 'key-1',
  name: 'default',
  type: 'publishable',
  api_key: 'sb_publishable_x',
}

describe('api key write mutations', () => {
  it('creates a key through the guarded client', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/api-keys',
      response: async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json<ApiKeyResponse>(key)
      },
    })

    const data = await createAPIKey({
      projectRef: 'proj',
      grant: testGrant('POST /v1/projects/{ref}/api-keys', { projectRef: 'proj' }),
      type: 'publishable',
      name: 'default',
    })

    expect(data.id).toBe('key-1')
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ type: 'publishable' }))
  })

  it('deletes a key through the guarded client', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'delete',
      path: '/v1/projects/:ref/api-keys/:id',
      response: () => {
        onRequest()
        return HttpResponse.json<ApiKeyResponse>(key)
      },
    })

    await deleteAPIKey({
      projectRef: 'proj',
      id: 'key-1',
      grant: testGrant('DELETE /v1/projects/{ref}/api-keys/{id}', { projectRef: 'proj' }),
    })

    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('requires a project ref', async () => {
    await expect(
      deleteAPIKey({
        id: 'key-1',
        grant: testGrant('DELETE /v1/projects/{ref}/api-keys/{id}'),
      })
    ).rejects.toThrow('projectRef is required')
  })
})
