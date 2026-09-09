import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useLogsQuery } from './useLogsQuery'
import type { paths } from '@/data/api'
import { safeSql } from '@/data/logs/safe-analytics-sql'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

type LogsResponse =
  paths['/platform/projects/{ref}/analytics/endpoints/logs.all']['get']['responses'][200]['content']['application/json']

const bigQuerySql = safeSql`select count(id) as count from edge_logs limit 1`
const otelSql = safeSql`select count() as count from logs where source = 'edge_logs' limit 1`
const start = '2026-09-01T00:00:00.000Z'
const end = '2026-09-02T00:00:00.000Z'

function Report({ useOtel }: { useOtel: boolean }) {
  const { logData, params, setParams } = useLogsQuery({
    projectRef: 'default',
    sql: useOtel ? otelSql : bigQuerySql,
    initialParams: { iso_timestamp_start: start, iso_timestamp_end: end },
    options: { useOtel },
  })

  return (
    <>
      <output>{logData[0]?.count?.toString()}</output>
      <span>{params.sql}</span>
      <button onClick={() => setParams((previous) => ({ ...previous, iso_timestamp_start: end }))}>
        Change range
      </button>
    </>
  )
}

describe('useLogsQuery controlled SQL', () => {
  it('switches SQL and endpoint together and keeps the engine caches separate', async () => {
    mswServer.use(
      http.get('*/api/enabled-features-overrides', () =>
        HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
      )
    )
    const requests: { engine: string; sql: string | null; start: string | null }[] = []
    for (const engine of ['logs.all', 'logs.all.otel'] as const) {
      addAPIMock({
        method: 'get',
        path: `/platform/projects/:ref/analytics/endpoints/${engine}`,
        response: ({ request }) => {
          const search = new URL(request.url).searchParams
          requests.push({
            engine,
            sql: search.get('sql'),
            start: search.get('iso_timestamp_start'),
          })
          return HttpResponse.json<LogsResponse>({
            result: [{ count: engine === 'logs.all' ? 1 : 2 }],
          })
        },
      })
    }

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = customRender(<Report useOtel={false} />, { queryClient })
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1'))

    rerender(<Report useOtel />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2'))
    expect(requests).toEqual([
      { engine: 'logs.all', sql: bigQuerySql, start },
      { engine: 'logs.all.otel', sql: otelSql, start },
    ])
    expect(
      queryClient.getQueryCache().findAll({ queryKey: ['projects', 'default', 'logs'] })
    ).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Change range' }))
    await waitFor(() => expect(requests).toHaveLength(3))
    expect(requests[2]).toEqual({ engine: 'logs.all.otel', sql: otelSql, start: end })
  })
})
