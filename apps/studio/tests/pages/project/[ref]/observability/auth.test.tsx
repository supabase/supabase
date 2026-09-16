import { waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import AuthReport from '@/pages/project/[ref]/observability/auth'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse_Output']

mockIntersectionObserver()

const renderPage = (useOtel: boolean) => (
  <FeatureFlagContext.Provider
    value={{ configcat: { otelReports: useOtel }, posthog: {}, hasLoaded: true }}
  >
    <AuthReport dehydratedState={undefined} />
  </FeatureFlagContext.Provider>
)

const LEGACY_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all'
const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
const PROJECT: ProjectDetailResponse = {
  id: 1,
  ref: 'default',
  organization_id: 1,
  name: 'Test Project',
  status: 'ACTIVE_HEALTHY',
  cloud_provider: 'AWS',
  region: 'us-east-1',
  db_host: 'db.default.supabase.co',
  restUrl: 'https://default.supabase.co/rest/v1/',
  inserted_at: '2026-09-15T00:00:00.000Z',
  updated_at: '2026-09-15T00:00:00.000Z',
  subscription_id: 'sub_123',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  high_availability: false,
  integration_source: null,
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  is_hibernating: false,
}

function renderAuthReport(useOtel: boolean) {
  const requests: string[] = []
  const response = ({ request }: { request: Request }) => {
    requests.push(new URL(request.url).pathname)
    return HttpResponse.json<AnalyticsResponse>({ result: [] })
  }

  addAPIMock({ method: 'get', path: LEGACY_ENDPOINT, response })
  addAPIMock({ method: 'get', path: OTEL_ENDPOINT, response })
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })

  const renderResult = customRender(renderPage(useOtel))

  return {
    requests,
    setUseOtel: (enabled: boolean) => renderResult.rerender(renderPage(enabled)),
  }
}

describe('Auth observability report endpoints', () => {
  it('routes Auth charts to OTEL while shared API charts stay legacy', async () => {
    const { requests } = renderAuthReport(true)

    await waitFor(() => expect(requests).toHaveLength(15))

    expect(requests.filter((path) => path.endsWith('/logs.all.otel'))).toHaveLength(8)
    expect(requests.filter((path) => path.endsWith('/logs.all'))).toHaveLength(7)
  })

  it('refetches Auth charts from OTEL when the report backend changes', async () => {
    const { requests, setUseOtel } = renderAuthReport(false)

    await waitFor(() => expect(requests).toHaveLength(15))

    expect(requests.filter((path) => path.endsWith('/logs.all.otel'))).toHaveLength(0)
    expect(requests.filter((path) => path.endsWith('/logs.all'))).toHaveLength(15)

    setUseOtel(true)

    await waitFor(() => expect(requests).toHaveLength(23))

    expect(requests.filter((path) => path.endsWith('/logs.all.otel'))).toHaveLength(8)
    expect(requests.filter((path) => path.endsWith('/logs.all'))).toHaveLength(15)
  })
})
