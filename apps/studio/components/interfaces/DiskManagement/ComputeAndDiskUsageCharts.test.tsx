import { QueryClient } from '@tanstack/react-query'
import { act, screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComputeAndDiskUsageCharts } from './ComputeAndDiskUsageCharts'
import type { InfraMonitoringMultiResponse } from '@/data/analytics/infra-monitoring-query'
import { analyticsKeys } from '@/data/analytics/keys'
import { projectKeys } from '@/data/projects/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

function renderUsage(
  balances: Array<string | undefined>,
  computeSize = 'micro',
  options: { hasError?: boolean; responseReady?: Promise<void> } = {}
) {
  const windows: Array<{ startDate: string | null; endDate: string | null }> = []
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/infra-monitoring',
    response: async ({ request }) => {
      await options.responseReady
      if (options.hasError) {
        return HttpResponse.json<APIErrorBody>({ message: 'Usage unavailable' }, { status: 500 })
      }
      const params = new URL(request.url).searchParams
      windows.push({ startDate: params.get('startDate'), endDate: params.get('endDate') })
      const attributes = new URL(request.url).searchParams.get('attributes')?.split(',') ?? []
      const data = balances.map((balance, index) => ({
        period_start: `2026-10-${10 + index}T00:00:00.000Z`,
        values: {
          max_cpu_usage: '40',
          ram_usage: '60',
          disk_io_budget: attributes.includes('disk_io_budget') ? balance : undefined,
          disk_io_consumption: balance === undefined ? undefined : String(100 - Number(balance)),
          pg_database_size: '40',
          disk_fs_used_wal: '5',
          disk_fs_used_system: '5',
          disk_fs_size: '100',
        },
      }))
      return HttpResponse.json<InfraMonitoringMultiResponse>({ series: {}, data })
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), {
    ref: 'default',
    status: 'ACTIVE_HEALTHY',
    infra_compute_size: computeSize,
  })

  const rendered = customRender(<ComputeAndDiskUsageCharts />, { queryClient })
  return { ...rendered, queryClient, windows }
}

describe('ComputeAndDiskUsageCharts', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows empty states without presenting missing disk metrics as zero', async () => {
    renderUsage([])

    expect(await screen.findByText('No compute data')).toBeInTheDocument()
    expect(screen.getByText('No disk data')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  it('shows both chart errors when the usage request fails', async () => {
    renderUsage([], 'micro', { hasError: true })

    expect(await screen.findAllByText('Failed to load usage data')).toHaveLength(2)
  })

  it('waits for loaded data before showing metrics or empty states', async () => {
    const { promise: responseReady, resolve } = Promise.withResolvers<void>()
    renderUsage(['99'], 'micro', { responseReady })

    expect(screen.queryByText('99%')).not.toBeInTheDocument()
    expect(screen.queryByText('No compute data')).not.toBeInTheDocument()
    expect(screen.queryByText('No disk data')).not.toBeInTheDocument()
    resolve()
    expect(await screen.findByText('99%')).toBeInTheDocument()
  })

  it('refreshes the request window after seven days without remounting', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'))
    const { queryClient, windows } = renderUsage(['99'])
    expect(await screen.findByText('99%')).toBeInTheDocument()

    vi.setSystemTime(new Date('2026-10-19T12:00:00.000Z'))
    await act(() =>
      queryClient.refetchQueries({
        queryKey: analyticsKeys.infraMonitoringGroup('default', {}).slice(0, -1),
      })
    )

    expect(windows).toEqual([
      { startDate: '2026-10-05T12:00:00.000Z', endDate: '2026-10-12T12:00:00.000Z' },
      { startDate: '2026-10-12T12:00:00.000Z', endDate: '2026-10-19T12:00:00.000Z' },
    ])
  })

  it('displays remaining balance without inflating healthy compute usage', async () => {
    renderUsage(['99'])

    expect(await screen.findByText('99%')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Disk IO balance' })).toBeInTheDocument()
    expect(screen.getAllByText('60%')).toHaveLength(2)
    expect(screen.queryByText('1%')).not.toBeInTheDocument()
  })

  it('displays the lowest sampled balance and scores its consumed amount', async () => {
    renderUsage(['99', '5', '90'])

    expect(await screen.findByText('5%')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
  })

  it('hides burst balance and excludes it from compute usage on dedicated IO compute', async () => {
    renderUsage(['5'], '4xlarge')

    expect(await screen.findByText('40%')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Disk IO balance' })).not.toBeInTheDocument()
    expect(screen.getAllByText('60%')).toHaveLength(2)
    expect(screen.queryByText('95%')).not.toBeInTheDocument()
  })

  it('displays missing balance as unavailable without inflating compute usage', async () => {
    renderUsage([undefined])

    expect(await screen.findByText('40%')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getAllByText('60%')).toHaveLength(2)
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
  })
})
