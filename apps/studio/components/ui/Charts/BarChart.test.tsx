import { act, waitFor } from '@testing-library/react'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { expect, it } from 'vitest'

import BarChart from './BarChart'
import StackedBarChart from './StackedBarChart'
import { customRender } from '@/tests/lib/custom-render'

const resizeObserver = mockResizeObserver()

it('renders a line for report metrics while preserving bars for other callers', async () => {
  const chart = (chartStyle: 'bar' | 'line') => (
    <BarChart
      chartStyle={chartStyle}
      data={[
        { timestamp: 1704067200000, count: 10 },
        { timestamp: 1704153600000, count: 20 },
      ]}
      xAxisKey="timestamp"
      yAxisKey="count"
    />
  )
  const { container, rerender } = customRender(chart('bar'))
  const [chartContainer] = resizeObserver.getObservedElements()
  if (!chartContainer) throw new Error('Expected a chart container')
  resizeObserver.mockElementSize(chartContainer, {
    contentBoxSize: { inlineSize: 600, blockSize: 160 },
  })
  act(() => resizeObserver.resize(chartContainer))
  await waitFor(() => expect(container.querySelector('.recharts-rectangle')).not.toBeNull())

  rerender(chart('line'))
  await waitFor(() => expect(container.querySelector('.recharts-line-curve')).not.toBeNull())
  expect(container.querySelector('.recharts-rectangle')).toBeNull()
})

it('renders cache hit and miss percentages as separate lines', async () => {
  const { container } = customRender(
    <StackedBarChart
      chartStyle="line"
      variant="percentages"
      data={[
        { timestamp: 1704067200000, count: 80, type: 'hit' },
        { timestamp: 1704067200000, count: 20, type: 'miss' },
        { timestamp: 1704153600000, count: 60, type: 'hit' },
        { timestamp: 1704153600000, count: 40, type: 'miss' },
      ]}
      xAxisKey="timestamp"
      yAxisKey="count"
      stackKey="type"
    />
  )
  const [chartContainer] = resizeObserver.getObservedElements()
  if (!chartContainer) throw new Error('Expected a chart container')
  resizeObserver.mockElementSize(chartContainer, {
    contentBoxSize: { inlineSize: 600, blockSize: 160 },
  })
  act(() => resizeObserver.resize(chartContainer))

  await waitFor(() => expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2))
  expect(container.querySelector('.recharts-rectangle')).toBeNull()
})
