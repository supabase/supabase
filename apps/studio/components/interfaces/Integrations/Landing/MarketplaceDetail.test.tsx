import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { MarketplaceDetail } from '@/components/interfaces/Integrations/Marketplace/MarketplaceDetail'
import { type components } from '@/data/api'
import { type APIKey } from '@/data/api-keys/api-keys-query'
import { type ProjectSecret } from '@/data/secrets/secrets-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

// The OAuth-apps query overrides its return type to `AuthorizedApp`, but the wire response (and so
// the MSW resolver) is the raw OpenAPI `OAuthAppResponse`. Build fixtures against the API shape.
type OAuthAppResponse = components['schemas']['OAuthAppResponse']
type PartnerIntegrationListResponse = components['schemas']['PartnerIntegrationListResponse']

const STABLE_PARAMS = { ref: 'default', id: 'grafana', pageId: 'overview' }
const STABLE_PROJECT = { data: { ref: 'default', connectionString: 'postgres://x' } }
const STABLE_ORG = { data: { slug: 'acme' } }
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, useParams: () => STABLE_PARAMS }
})
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => STABLE_PROJECT,
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => STABLE_ORG,
}))
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const STABLE_INTEGRATIONS = [
  {
    id: 'grafana',
    name: 'Grafana',
    type: 'oauth',
    source: 'Partner',
    description: 'Grafana',
    content: 'Grafana overview content',
    docsUrl: null,
    siteUrl: null,
    author: { name: 'Grafana Labs' },
    oauthAppId: 'grafana-app',
    icon: () => null,
    navigate: () => null,
    navigation: [{ route: 'overview', label: 'Overview' }],
  },
]
const STABLE_EMPTY_ARR = [] as unknown[]
vi.mock('@/components/interfaces/Integrations/Landing/useAvailableIntegrations', () => ({
  useAvailableIntegrations: () => ({
    data: STABLE_INTEGRATIONS,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  }),
}))
vi.mock('@/data/fdw/fdws-query', () => ({
  useFDWsQuery: () => ({
    data: STABLE_EMPTY_ARR,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  }),
}))
vi.mock('@/data/database-extensions/database-extensions-query', () => ({
  useDatabaseExtensionsQuery: () => ({
    data: STABLE_EMPTY_ARR,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  }),
}))
vi.mock('@/data/database/schemas-query', () => ({
  useSchemasQuery: () => ({
    data: STABLE_EMPTY_ARR,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
  }),
}))

let authConfigRequests = 0
const mockProjectResources = () => {
  authConfigRequests = 0
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<APIKey[]>([]),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/secrets',
    response: () => HttpResponse.json<ProjectSecret[]>([]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    // A role without permission to read auth config - this is the scenario
    // useProjectOAuthIntegrationData tolerates by falling back to `null`.
    response: () => {
      authConfigRequests++
      return HttpResponse.json<APIErrorBody>({ message: 'forbidden' }, { status: 403 })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/partners/:ref',
    response: () => HttpResponse.json<PartnerIntegrationListResponse>({ integrations: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/oauth/apps',
    response: () => HttpResponse.json<OAuthAppResponse[]>([]),
  })
}

describe('MarketplaceDetail', () => {
  test('a permission-denied resource does not put the page into an endless refetch loop', async () => {
    mockProjectResources()
    routerMock.setCurrentUrl('/project/default/integrations/grafana/overview')

    customRender(<MarketplaceDetail />)

    // Let any queries settle, plus a few ticks to catch a refetch loop if one exists.
    await new Promise((resolve) => setTimeout(resolve, 300))

    // A settled 403 should only ever be fetched once (the initial attempt) - not retried
    // in an endless mount/unmount cycle driven by its own `isLoading` flag.
    expect(authConfigRequests).toBeLessThanOrEqual(1)
  })
})
