import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import {
  EDGE_FUNCTION_LOGS_VIEW,
  getEdgeFunctionLogsScope,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { miscKeys } from '@/data/misc/keys'
import { projectKeys } from '@/data/projects/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
mockAnimationsApi()

it('renders request and runtime rows using logs.all and opens runtime metadata', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(
    projectKeys.detail('default'),
    createMockProject({ ref: 'default', status: 'INACTIVE' })
  )
  client.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: async ({ request }) => {
      const { sql } = z.object({ sql: z.string() }).parse(await request.json())
      expect(sql).toMatch(/(?:request|runtime)_metadata.function_id = 'hello'/)
      const isList = sql.includes('ORDER BY timestamp DESC')
      const runtime = sql.includes('FROM function_logs')
      return HttpResponse.json<AnalyticsResponse>({
        result: isList
          ? [
              {
                id: runtime ? 'runtime-log' : 'request-log',
                timestamp: Date.now() * 1000,
                log_type: runtime ? 'edge function runtime' : 'edge function',
                status: runtime ? null : '200',
                pathname: runtime ? null : '/hello',
                method: runtime ? null : 'GET',
                level: 'success',
                event_message: runtime ? 'Worker started' : 'GET /hello 200',
                log_count: null,
                logs: null,
                metadata: [
                  {
                    function_id: 'hello',
                    execution_id: 'worker-1',
                    event_type: runtime ? 'Boot' : null,
                  },
                ],
              },
            ]
          : [],
      })
    },
  })
  customRender(
    <UnifiedLogs
      scope={getEdgeFunctionLogsScope('hello')}
      hasFilterSideBar={false}
      {...EDGE_FUNCTION_LOGS_VIEW}
    />,
    { queryClient: client, nuqs: { hasMemory: true } }
  )
  expect(await screen.findByText('Worker started')).toBeVisible()
  expect(screen.getByText('/hello')).toBeVisible()
  fireEvent.click(screen.getByText('Worker started'))
  fireEvent.click(await screen.findByRole('button', { name: /^Details$/ }))
  expect(await screen.findByText('worker-1')).toBeVisible()
})
