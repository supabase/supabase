import { act, render, renderHook, screen } from '@testing-library/react'
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
