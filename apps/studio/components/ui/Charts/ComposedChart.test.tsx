import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { describe, expect, it, vi } from 'vitest'

import { ComposedChart } from './ComposedChart'
import { customRender } from '@/tests/lib/custom-render'

const resizeObserver = mockResizeObserver()

describe('ComposedChart', () => {
  it('hides the chart style control when line charts are required and restores the saved style when disabled', async () => {
    const onChartStyleChange = vi.fn()
    const chart = (shouldDefaultToLineCharts: boolean) => (
      <FeatureFlagContext.Provider
        value={{
          configcat: { defaultToLineCharts: shouldDefaultToLineCharts },
          posthog: {},
          hasLoaded: true,
        }}
      >
        <ComposedChart
          title="Requests"
          data={[
            { timestamp: 1704067200000, requests: 10 },
            { timestamp: 1704153600000, requests: 20 },
          ]}
          attributes={[{ attribute: 'requests', provider: 'daily-stats' }]}
          xAxisKey="timestamp"
          yAxisKey="requests"
          chartStyle="bar"
          onChartStyleChange={onChartStyleChange}
          updateDateRange={vi.fn()}
        />
      </FeatureFlagContext.Provider>
    )
    const { container, rerender } = customRender(chart(false))
    const [chartContainer] = resizeObserver.getObservedElements()
    if (!chartContainer) throw new Error('Expected a chart container')
    resizeObserver.mockElementSize(chartContainer, {
      contentBoxSize: { inlineSize: 600, blockSize: 160 },
    })
    act(() => resizeObserver.resize(chartContainer))
    await waitFor(() => expect(container.querySelector('.recharts-rectangle')).not.toBeNull())

    await userEvent.click(screen.getByRole('button', { name: 'View as line chart' }))
    expect(onChartStyleChange).toHaveBeenCalledWith('line')
    onChartStyleChange.mockClear()

    rerender(chart(true))
    expect(screen.queryByRole('button', { name: /View as .* chart/ })).not.toBeInTheDocument()
    expect(onChartStyleChange).not.toHaveBeenCalled()
    await waitFor(() => expect(container.querySelector('.recharts-area-curve')).not.toBeNull())
    expect(container.querySelector('.recharts-rectangle')).toBeNull()

    rerender(chart(false))
    expect(screen.getByRole('button', { name: 'View as line chart' })).toBeVisible()
    await waitFor(() => expect(container.querySelector('.recharts-rectangle')).not.toBeNull())
    expect(container.querySelector('.recharts-area-curve')).toBeNull()
    expect(onChartStyleChange).not.toHaveBeenCalled()
  })
})
