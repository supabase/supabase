import { QueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { createThirdPartyIntegration } from './integration-create-mutation'
import { deleteThirdPartyIntegration } from './integration-delete-mutation'
import { thirdPartyAuthIntegrationsQueryOptions } from './integrations-query'
import { addAPIMock } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

const projectRef = 'proj'
type Integration = components['schemas']['ThirdPartyAuth_Output']

const INTEGRATION: Integration = {
  id: 'tpa-1',
  type: 'oidc',
  oidc_issuer_url: 'https://example.com',
  jwks_url: null,
  custom_jwks: null,
  resolved_jwks: null,
  inserted_at: '2025-02-16T22:24:42.115195Z',
  updated_at: '2025-02-16T22:24:42.115195Z',
  resolved_at: null,
}

describe('third-party auth data layer', () => {
  it('lists integrations through the guarded client', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/third-party-auth',
      response: [INTEGRATION],
    })
    const grant = testGrant('GET /v1/projects/{ref}/config/auth/third-party-auth', { projectRef })

    const data = await new QueryClient().fetchQuery(
      thirdPartyAuthIntegrationsQueryOptions({ projectRef, grant })
    )

    expect(data).toHaveLength(1)
  })

  it('stays disabled without a grant', () => {
    expect(thirdPartyAuthIntegrationsQueryOptions({ projectRef }).enabled).toBe(false)
  })

  it('creates an integration', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/config/auth/third-party-auth',
      response: async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json<Integration>(INTEGRATION)
      },
    })

    await createThirdPartyIntegration({
      projectRef,
      grant: testGrant('POST /v1/projects/{ref}/config/auth/third-party-auth', { projectRef }),
      oidcIssuerUrl: 'https://example.com',
    })

    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({ oidc_issuer_url: 'https://example.com' })
    )
  })

  it('deletes an integration', async () => {
    const onRequest = vi.fn()
    addAPIMock({
      method: 'delete',
      path: '/v1/projects/:ref/config/auth/third-party-auth/:tpa_id',
      response: () => {
        onRequest()
        return HttpResponse.json<Integration>(INTEGRATION)
      },
    })

    await deleteThirdPartyIntegration({
      projectRef,
      grant: testGrant('DELETE /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}', {
        projectRef,
      }),
      tpaId: 'tpa-1',
    })

    expect(onRequest).toHaveBeenCalledTimes(1)
  })
})
