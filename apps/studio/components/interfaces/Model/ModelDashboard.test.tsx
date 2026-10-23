import { Blob } from 'node:buffer'
import { DecompressionStream } from 'node:stream/web'
import { gzipSync } from 'node:zlib'
import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createExampleModel } from './model.schema'
import { ModelDashboard } from './ModelDashboard'
import type { InfraMonitoringMultiResponse } from '@/data/analytics/infra-monitoring-query'
import { projectKeys } from '@/data/projects/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const resizeObserver = mockResizeObserver()

beforeAll(() => {
  vi.stubGlobal('Blob', Blob)
  vi.stubGlobal('DecompressionStream', DecompressionStream)
})
afterAll(() => vi.unstubAllGlobals())
afterEach(() => window.history.replaceState(null, '', '/'))

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(projectKeys.detail('default'), { ref: 'default', name: 'Test project' })
  return customRender(<ModelDashboard />, { queryClient })
}

const model = createExampleModel(new Date('2026-10-21T09:00:00Z'))
function changeModel(value: unknown) {
  const hash = `#v1=${gzipSync(JSON.stringify(value)).toString('base64url')}`
  window.history.replaceState(null, '', `/${hash}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

describe('dashboard viewer', () => {
  it('does not request metrics for invalid models and renders API failures separately from empty data', async () => {
    const requests: URL[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/infra-monitoring',
      response: ({ request }) => {
        const url = new URL(request.url)
        requests.push(url)
        const attribute = url.searchParams.get('attributes')
        if (!attribute) throw new Error('Expected a metric attribute')
        if (attribute === 'avg_cpu_usage')
          return HttpResponse.json<APIErrorBody>({ message: 'Metric unavailable' }, { status: 403 })
        return HttpResponse.json<InfraMonitoringMultiResponse>({
          series: {
            [attribute]: { format: 'percent', total: 0, totalAverage: 0, yAxisLimit: 100 },
          },
          data: [],
        })
      },
    })
    changeModel({ ...model, panels: [{ metric: 'arbitrary_url' }] })
    renderDashboard()
    expect(await screen.findByText('Unable to open dashboard link')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
    act(() => changeModel({ ...model, panels: [{ metric: 'cpu' }, { metric: 'memory' }] }))
    expect(await screen.findByText('Failed to retrieve cpu usage')).toBeInTheDocument()
    expect(await screen.findByText('No metric data')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Agent annotations' })).toBeInTheDocument()
    await waitFor(() => expect(requests).toHaveLength(2))
    for (const request of requests) {
      expect(request.pathname).toContain('/projects/default/infra-monitoring')
      expect(request.searchParams.get('startDate')).toBe(model.start)
      expect(request.searchParams.get('endDate')).toBe(model.end)
      expect(request.searchParams.get('interval')).toBe(model.interval)
    }
  })

  it('renders real samples and a vertical timestamp annotation', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/infra-monitoring',
      response: () =>
        HttpResponse.json<InfraMonitoringMultiResponse>({
          series: {
            avg_cpu_usage: { format: 'percent', total: 75, totalAverage: 25, yAxisLimit: 100 },
          },
          data: [
            { period_start: model.start, values: { avg_cpu_usage: '0' } },
            { period_start: model.annotations[0].at, values: { avg_cpu_usage: '50' } },
            { period_start: model.end, values: { avg_cpu_usage: '25' } },
          ],
        }),
    })
    changeModel({ ...model, panels: [{ metric: 'cpu' }] })
    const { container } = renderDashboard()
    expect(await screen.findByTestId('chart-line')).toBeInTheDocument()
    const [observed] = resizeObserver.getObservedElements()
    if (!observed) throw new Error('Expected a chart container')
    resizeObserver.mockElementSize(observed, {
      contentBoxSize: { inlineSize: 600, blockSize: 224 },
    })
    act(() => resizeObserver.resize(observed))
    await waitFor(() => expect(container.querySelector('.recharts-area-curve')).not.toBeNull())
    const marker = container.querySelector('.recharts-reference-line-line')
    expect(marker).not.toBeNull()
    expect(marker?.getAttribute('x1')).toBe(marker?.getAttribute('x2'))
    expect(marker?.getAttribute('y1')).not.toBe(marker?.getAttribute('y2'))
    expect(screen.getByRole('region', { name: 'Agent annotations' })).toHaveTextContent(
      model.annotations[0].label
    )
  })

  it('shows per-metric errors in a successful multi-format response', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/infra-monitoring',
      response: () =>
        HttpResponse.json<InfraMonitoringMultiResponse>({
          data: [],
          series: {},
          errors: { avg_cpu_usage: { message: 'Metric is not supported' } },
        }),
    })
    changeModel({ ...model, panels: [{ metric: 'cpu' }] })
    renderDashboard()
    expect(await screen.findByText('Metric is not supported', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('No metric data')).not.toBeInTheDocument()
  })
})
