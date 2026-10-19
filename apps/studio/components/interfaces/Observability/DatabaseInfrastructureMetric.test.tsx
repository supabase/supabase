import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { DatabaseInfrastructureSection } from './DatabaseInfrastructureSection'
import type { InfraMonitoringMultiResponse } from '@/data/analytics/infra-monitoring-query'
import { databaseKeys } from '@/data/database/keys'
import { projectKeys } from '@/data/projects/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const values: Record<string, number> = {
  avg_cpu_usage: 25,
  ram_usage: 60,
  disk_io_consumption: 40,
  disk_fs_used_system: 10,
  disk_fs_used_wal: 5,
  pg_database_size: 35,
  disk_fs_size: 100,
  pg_stat_database_num_backends: 12,
}

function mockMetrics(failedAttribute?: string, includeErrors = true) {
  const requests: string[][] = []
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/infra-monitoring',
    response: ({ request }) => {
      const attributes = new URL(request.url).searchParams.get('attributes')!.split(',')
      requests.push(attributes)
      const succeeded = attributes.filter(
        (attribute) => failedAttribute !== '*' && attribute !== failedAttribute
      )
      const failed = attributes.filter((attribute) => !succeeded.includes(attribute))
      const series = Object.fromEntries(
        succeeded.map((attribute) => [
          attribute,
          {
            totalAverage: values[attribute],
            total: values[attribute],
            format: '%',
            yAxisLimit: 100,
          },
        ])
      )
      const pointValues = Object.fromEntries(
        succeeded.map((attribute) => [attribute, String(values[attribute])])
      )
      return HttpResponse.json<InfraMonitoringMultiResponse>({
        series,
        data: succeeded.length
          ? [{ period_start: '2026-09-24T00:00:00Z', values: pointValues }]
          : [],
        ...(includeErrors
          ? {
              errors: Object.fromEntries(
                failed.map((attribute) => [attribute, { message: 'Metric is not supported' }])
              ),
            }
          : {}),
      })
    },
  })
  return requests
}

function renderMetrics() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), {
    ref: 'default',
    status: 'ACTIVE_HEALTHY',
    connectionString: 'postgresql://localhost/postgres',
  })
  queryClient.setQueryData(databaseKeys.maxConnections('default'), { maxConnections: 100 })
  customRender(
    <DatabaseInfrastructureSection
      interval="1day"
      refreshKey={0}
      dbErrorRate={0}
      isLoading={false}
    />,
    { queryClient }
  )
}

function card(label: string) {
  return within(screen.getByRole('link', { name: new RegExp(label) }))
}

describe('DatabaseInfrastructureSection batched metrics', () => {
  it.each([false, true])(
    'renders all metrics from one request (errors field: %s)',
    async (includeErrors) => {
      const requests = mockMetrics(undefined, includeErrors)
      renderMetrics()

      expect(await card('CPU').findByText('25%')).toBeInTheDocument()
      expect(await card('Memory').findByText('60%')).toBeInTheDocument()
      expect(await card('Disk IO').findByText('40%')).toBeInTheDocument()
      expect(await card('Disk Usage').findByText('50%')).toBeInTheDocument()
      expect(await card('Peak Connections').findByText('12/100')).toBeInTheDocument()
      expect(requests).toHaveLength(1)
      expect(requests[0].sort()).toEqual(Object.keys(values).sort())
    }
  )

  it.each([
    ['disk_io_consumption', 'Disk IO'],
    ['disk_fs_used_wal', 'Disk Usage'],
    ['pg_stat_database_num_backends', 'Peak Connections'],
  ])('isolates a failed %s result to %s', async (attribute, label) => {
    const requests = mockMetrics(attribute)
    renderMetrics()

    expect(await card(label).findByText('Metric is not supported')).toBeInTheDocument()
    expect(await card('CPU').findByText('25%')).toBeInTheDocument()
    expect(await card('Memory').findByText('60%')).toBeInTheDocument()
    expect(screen.getAllByText('Metric is not supported')).toHaveLength(1)
    expect(card(label).queryByText('0%')).not.toBeInTheDocument()
    expect(requests).toHaveLength(1)
  })

  it('shows every affected card error when all results fail', async () => {
    const requests = mockMetrics('*')
    renderMetrics()
    await waitFor(() => expect(screen.getAllByText('Metric is not supported')).toHaveLength(5))
    expect(requests).toHaveLength(1)
  })

  it('does not display missing series as zero', async () => {
    mockMetrics('disk_io_consumption', false)
    renderMetrics()
    expect(await card('Disk IO').findByText('Error loading data')).toBeInTheDocument()
    expect(await card('CPU').findByText('25%')).toBeInTheDocument()
  })

  it('shows request-wide failures on every infrastructure card', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/infra-monitoring',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not found' }, { status: 404 }),
    })
    renderMetrics()
    await waitFor(() => expect(screen.getAllByText('Project not found')).toHaveLength(5))
  })
})
