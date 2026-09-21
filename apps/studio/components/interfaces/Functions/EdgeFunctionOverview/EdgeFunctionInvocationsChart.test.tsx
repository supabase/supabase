import { fireEvent, render, waitFor } from '@testing-library/react'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { expect, it, vi } from 'vitest'

import { EdgeFunctionInvocationsChart } from './EdgeFunctionInvocationsChart'
import type { InvocationChartDatum } from './EdgeFunctionOverview.utils'

const resizeObserver = mockResizeObserver()

const renderChart = async ({
  chartData,
  onChartClick,
}: {
  chartData: InvocationChartDatum[]
  onChartClick: (timestamp: string) => void
}) => {
  const result = render(
    <EdgeFunctionInvocationsChart
      chartData={chartData}
      dateTimeFormat="MMM D, h:mma"
      onChartClick={onChartClick}
    />
  )
  const [chartContainer] = resizeObserver.getObservedElements()

  if (!chartContainer) throw new Error('Expected the chart container to be observed')

  resizeObserver.mockElementSize(chartContainer, {
    contentBoxSize: { inlineSize: 600, blockSize: 160 },
  })
  resizeObserver.resize(chartContainer)

  await waitFor(() => expect(result.container.querySelector('.recharts-surface')).not.toBeNull())

  return result
}

it('passes the clicked bar timestamp to the chart click handler', async () => {
  const timestamp = '2026-03-20T10:30:00.000Z'
  const onChartClick = vi.fn()
  const { container } = await renderChart({
    chartData: [{ timestamp, ok_count: 3, warning_count: 1, error_count: 2 }],
    onChartClick,
  })
  await waitFor(() => expect(container.querySelector('.recharts-rectangle')).not.toBeNull())
  const bar = container.querySelector('.recharts-rectangle')

  if (!bar) throw new Error('Expected a chart bar to render')

  fireEvent.mouseEnter(bar)
  fireEvent.click(bar)

  expect(onChartClick).toHaveBeenCalledOnce()
  expect(onChartClick).toHaveBeenCalledWith(timestamp)
})

it('ignores a chart click without an active payload', async () => {
  const onChartClick = vi.fn()
  const { container } = await renderChart({ chartData: [], onChartClick })
  const chart = container.querySelector('.recharts-surface')

  if (!chart) throw new Error('Expected the chart surface to render')

  fireEvent.click(chart)

  expect(onChartClick).not.toHaveBeenCalled()
})
