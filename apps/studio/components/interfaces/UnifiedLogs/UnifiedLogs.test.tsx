import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { UnifiedLogs } from './UnifiedLogs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = components['schemas']['AnalyticsResponse_Output']
type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']

mockAnimationsApi()

describe('UnifiedLogs', () => {
  it('refreshes pathname options for a sidebar filter change before the URL updates', async () => {
    let pathnameOption: string | null = null
    let requestedBeforeUrlUpdate = false
    let analyticsRequests = 0
    let analyticsRequestsBeforeMethodChange = 0
    const onUrlUpdate = vi.fn()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectResponse>({
          id: 1,
          ref: 'default',
          organization_id: 1,
          name: 'Test Project',
          status: 'INACTIVE',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          inserted_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          subscription_id: 'sub_123',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
          connectionString: null,
        }),
    })

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => {
        analyticsRequests += 1
        if (pathnameOption === '/after') {
          if (analyticsRequests === analyticsRequestsBeforeMethodChange + 1) {
            requestedBeforeUrlUpdate = onUrlUpdate.mock.calls.length === 0
            return HttpResponse.json<AnalyticsResponse>({
              result: [{ value: '/after', count: 1 }],
            })
          }
          return HttpResponse.json<AnalyticsResponse>({ result: [] })
        }
        return HttpResponse.json<AnalyticsResponse>({
          result: pathnameOption === null ? [] : [{ value: pathnameOption, count: 1 }],
        })
      },
    })

    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: true }}
      >
        <UnifiedLogs />
      </FeatureFlagContext.Provider>,
      {
        nuqs: { hasMemory: true, onUrlUpdate },
        queryClient,
      }
    )

    expect(await screen.findByText('No results found')).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    pathnameOption = '/before'
    fireEvent.click(screen.getByRole('button', { name: 'Pathname' }))
    expect(await screen.findByText('/before')).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    onUrlUpdate.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Method' }))
    analyticsRequestsBeforeMethodChange = analyticsRequests
    pathnameOption = '/after'
    fireEvent.click(screen.getByRole('checkbox', { name: /POST/ }))

    expect(screen.queryByText('/before')).not.toBeInTheDocument()
    expect(await screen.findByText('/after')).toBeInTheDocument()
    expect(requestedBeforeUrlUpdate).toBe(true)
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
  })
})
