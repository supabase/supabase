import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { describe, expect, it } from 'vitest'

import { ChartHeader } from './ChartHeader'
import { useChartHoverState } from './useChartHoverState'

describe('ChartHeader missing risk metric', () => {
  it('shows unavailable during synced hover instead of summing a missing metric to zero', () => {
    const GIB = 1024 ** 3
    const hover = renderHook(() => useChartHoverState('other-chart'))
    render(
      <ChartHeader
        title="Memory commitment"
        minimalHeader
        hideChartType
        highlightedValue={4 * GIB}
        shouldFormatBytes
        isMemoryChart
        syncId="memory-report"
        xAxisIsDate={false}
        xAxisKey="period_start"
        yAxisKey="ram_commit_used"
        referenceZoneAttribute="ram_commit_used"
        data={[
          { period_start: 1, ram_commit_limit: 5 * GIB },
          { period_start: 2, ram_commit_used: 4 * GIB, ram_commit_limit: 5 * GIB },
        ]}
        attributes={[
          { attribute: 'ram_commit_used' },
          { attribute: 'ram_commit_limit', omitFromTotal: true, enabled: false },
        ]}
      />
    )

    try {
      act(() => hover.result.current.setHover(0))
      expect(screen.getByText('Unavailable')).toBeInTheDocument()
      expect(screen.queryByText('0 MB')).not.toBeInTheDocument()

      act(() => hover.result.current.setHover(1))
      expect(screen.getByText('4 GB')).toBeInTheDocument()
      expect(screen.queryByText('Unavailable')).not.toBeInTheDocument()
    } finally {
      act(() => hover.result.current.clearHover())
    }
  })
})

it('provides the selected range warning and guidance from a keyboard-focusable badge', async () => {
  render(
    <TooltipProvider delayDuration={0}>
      <ChartHeader
        title="Memory commitment"
        hideChartType
        highlightedValue="6 GB"
        referenceZoneWarning={{
          label: 'Problematic',
          color: 'var(--color-orange-900)',
          tooltip: 'Optimize memory usage or upgrade compute.',
        }}
      />
    </TooltipProvider>
  )

  const badge = screen.getByLabelText('Warning: Problematic')
  expect(badge).toHaveAttribute('tabindex', '0')
  fireEvent.focus(badge)

  const tooltip = await screen.findByRole('tooltip')
  expect(tooltip).toHaveTextContent('Problematic threshold crossed in this time range.')
  expect(tooltip).toHaveTextContent('Optimize memory usage or upgrade compute.')
})
