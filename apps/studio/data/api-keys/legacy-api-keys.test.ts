import { QueryClient } from '@tanstack/react-query'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { toggleLegacyAPIKeys } from './legacy-api-key-toggle-mutation'
import { legacyAPIKeysStatusQueryOptions } from './legacy-api-keys-status-query'
import { addAPIMock } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

const projectRef = 'proj'

describe('legacy api keys data layer', () => {
  it('reads the status through the guarded client with the api gateway grant', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys/legacy',
      response: { enabled: true },
    })
    const grant = testGrant('GET /v1/projects/{ref}/api-keys/legacy', { projectRef })

    const data = await new QueryClient().fetchQuery(
      legacyAPIKeysStatusQueryOptions({ projectRef, grant })
    )

    expect(data.enabled).toBe(true)
  })

  it('stays disabled without a grant', () => {
    expect(legacyAPIKeysStatusQueryOptions({ projectRef }).enabled).toBe(false)
  })

  it('toggles the legacy keys', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'put',
      path: '/v1/projects/:ref/api-keys/legacy',
      response: ({ request }) => {
        onRequest(new URL(request.url).searchParams.get('enabled'))
        return HttpResponse.json<{ enabled: boolean }>({ enabled: false })
      },
    })

    await toggleLegacyAPIKeys({
      projectRef,
      grant: testGrant('PUT /v1/projects/{ref}/api-keys/legacy', { projectRef }),
      enabled: false,
    })

    expect(onRequest).toHaveBeenCalledWith('false')
  })
})
