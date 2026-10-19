import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { expect, it, vi } from 'vitest'

import { ChartBlock } from './ChartBlock'
import { analyticsKeys } from '@/data/analytics/keys'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const resizeObserver = mockResizeObserver()

it('temporarily displays saved bars as lines without updating the saved report', async () => {
  routerMock.setCurrentUrl('/projects/default')
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(
    analyticsKeys.infraMonitoring('default', {
      attribute: 'total_auth_requests',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
    }),
    {
      data: [
        { period_start: '2024-01-01', total_auth_requests: 10 },
        { period_start: '2024-01-02', total_auth_requests: 20 },
      ],
    }
  )
  const onUpdateChartConfig = vi.fn()
  const chart = (shouldDefaultToLineCharts: boolean) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: { defaultToLineCharts: shouldDefaultToLineCharts },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <ChartBlock
        label="Auth requests"
        attribute="total_auth_requests"
        provider="daily-stats"
        startDate="2024-01-01"
        endDate="2024-01-02"
        onUpdateChartConfig={onUpdateChartConfig}
      />
    </FeatureFlagContext.Provider>
  )
  const { container, rerender } = customRender(chart(true), { queryClient })
  const [chartContainer] = resizeObserver.getObservedElements()
  if (!chartContainer) throw new Error('Expected a chart container')
  resizeObserver.mockElementSize(chartContainer, {
    contentBoxSize: { inlineSize: 600, blockSize: 160 },
  })
  act(() => resizeObserver.resize(chartContainer))
  await waitFor(() => expect(container.querySelector('.recharts-line-curve')).not.toBeNull())
  expect(screen.queryByRole('button', { name: /View as .* chart/ })).not.toBeInTheDocument()
  expect(onUpdateChartConfig).not.toHaveBeenCalled()

  rerender(chart(false))
  await waitFor(() => expect(container.querySelector('.recharts-rectangle')).not.toBeNull())
  await userEvent.click(screen.getByRole('button', { name: 'View as line chart' }))
  expect(onUpdateChartConfig).toHaveBeenCalledWith({ chart: { chart_type: 'line' } })
})
