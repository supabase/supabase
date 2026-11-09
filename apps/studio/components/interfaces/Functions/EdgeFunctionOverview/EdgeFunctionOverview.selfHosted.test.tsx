import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, it } from 'vitest'

import { EdgeFunctionOverview } from './EdgeFunctionOverview'
import { configKeys } from '@/data/config/keys'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { miscKeys } from '@/data/misc/keys'
import { projectKeys } from '@/data/projects/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

function renderOverview(logsEnabled: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), {
    disabled_features: logsEnabled ? [] : ['logs:all'],
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(configKeys.settingsV2('default'), {
    app_config: { endpoint: 'localhost:8000' },
  })
  queryClient.setQueryData<EdgeFunction>(edgeFunctionsKeys.detail('default', undefined), {
    id: 'hello',
    slug: 'hello',
    name: 'Hello',
    version: 1,
    status: 'ACTIVE',
    created_at: Date.now() - 3600000,
    updated_at: Date.now() - 3600000,
  })
  return customRender(<EdgeFunctionOverview />, { queryClient })
}

it('shows setup guidance without querying analytics when logging is disabled', async () => {
  renderOverview(false)
  expect(await screen.findByText('Function logs are not enabled')).toBeVisible()
  expect(screen.queryByText('Usage')).not.toBeInTheDocument()
})

it('renders invocation metrics and leaves unavailable worker measurements empty', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/analytics/endpoints/functions.combined-stats',
    response: ({ request }) => {
      expect(new URL(request.url).searchParams.get('function_id')).toBe('hello')
      return HttpResponse.json<{ result: Record<string, number | string | null>[] }>({
        result: [
          {
            timestamp: new Date().toISOString(),
            requests_count: 2,
            worker_count: 0,
            success_count: 1,
            server_err_count: 1,
            avg_execution_time: 20,
            max_execution_time: 30,
            avg_cpu_time_used: null,
            max_cpu_time_used: null,
            avg_memory_used: null,
            avg_heap_memory_used: null,
            avg_external_memory_used: null,
          },
        ],
      })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: () => HttpResponse.json<{ result: never[] }>({ result: [] }),
  })
  renderOverview(true)
  expect(await screen.findByText('20ms')).toBeVisible()
  expect(screen.getAllByText('No data to show')).toHaveLength(2)
  expect(screen.getByText(/CPU and memory measured when workers shut down/)).toBeVisible()
  expect(screen.queryByText('0ms')).not.toBeInTheDocument()
})

it('shows query failures instead of successful empty metrics', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/analytics/endpoints/functions.combined-stats',
    response: () =>
      HttpResponse.json<{ message: string }>({ message: 'Analytics unavailable' }, { status: 500 }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: () => HttpResponse.json<{ result: never[] }>({ result: [] }),
  })
  renderOverview(true)
  expect(await screen.findByText('Unable to load execution time')).toBeVisible()
})
