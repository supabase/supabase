import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { Button, TooltipProvider } from 'ui'
import { afterEach, describe, expect, it } from 'vitest'

import { ChartHeader } from './ChartHeader'
import { memoryCommitmentThresholds } from './Charts.test-fixtures'
import { useChartHoverState } from './useChartHoverState'
import { edgeFunctionReports } from '@/data/reports/v2/edge-functions.config'

it.each(['Warning', 'Problematic', 'Severe'])(
  'shows %s so the commitment risk is readable without opening details',
  (expectedLabel) => {
    const threshold = memoryCommitmentThresholds.find((zone) => zone.badgeLabel === expectedLabel)
    if (!threshold) throw new Error(`Missing memory commitment threshold: ${expectedLabel}`)

    render(
      <TooltipProvider>
        <ChartHeader
          title="Memory commitment"
          hideChartType
          highlightedValue="6 GB"
          thresholdZoneWarning={threshold}
        />
      </TooltipProvider>
    )

    const badge = screen.getByLabelText(`Warning: ${threshold.label}`)
    expect(badge).toHaveTextContent(expectedLabel)
    expect(badge).toHaveAttribute('tabindex', '0')
  }
)

describe('header stats', () => {
  const SYNC_ID = 'edge-functions-test'
  const statusCodesReport = edgeFunctionReports({
    projectRef: 'default',
    functions: [],
    startDate: '2026-07-28T09:00:00.000Z',
    endDate: '2026-07-28T09:02:00.000Z',
    interval: '1m',
    filters: { status_code: null, region: [], execution_time: null, functions: [] },
  }).find((report) => report.id === 'execution-status-codes')
  if (!statusCodesReport) throw new Error('Missing edge function status codes report')

  const data = [
    { timestamp: '2026-07-28T09:00:00.000Z', '200': 10, '404': 2, '500': 1 },
    { timestamp: '2026-07-28T09:01:00.000Z', '200': 5, '404': 1, '500': 0 },
    { timestamp: '2026-07-28T09:02:00.000Z', '200': 0, '404': 0, '500': 1200 },
  ]

  const HoverButton = ({ index }: { index: number }) => {
    const { setHover } = useChartHoverState(SYNC_ID)
    return <Button onClick={() => setHover(index)}>Hover point {index}</Button>
  }

  const renderHeader = () =>
    render(
      <TooltipProvider>
        <HoverButton index={0} />
        <HoverButton index={2} />
        <ChartHeader
          title="Edge Function Status Codes"
          syncId={SYNC_ID}
          data={data}
          getHeaderStats={statusCodesReport.getHeaderStats}
        />
      </TooltipProvider>
    )

  const getStat = (label: string) => screen.getByText(label).parentElement?.parentElement

  afterEach(() => {
    // Hover state is module-level, so clear it between tests
    const { result } = renderHook(() => useChartHoverState(SYNC_ID))
    act(() => result.current.clearHover())
  })

  it('shows warning and error counts for the whole period by default', () => {
    renderHeader()

    expect(getStat('Warnings')).toHaveTextContent('3')
    expect(getStat('Errors')).toHaveTextContent('1,201')
  })

  it('shows the counts for the hovered point only', () => {
    renderHeader()

    fireEvent.click(screen.getByText('Hover point 0'))
    expect(getStat('Warnings')).toHaveTextContent('2')
    expect(getStat('Errors')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('Hover point 2'))
    expect(getStat('Warnings')).toHaveTextContent('0')
    expect(getStat('Errors')).toHaveTextContent('1,200')
  })

  it('shows the counts for the locally hovered point when hover is not synced', () => {
    render(
      <TooltipProvider>
        <ChartHeader
          title="Edge Function Status Codes"
          syncId={SYNC_ID}
          data={data}
          focusedIndex={2}
          getHeaderStats={statusCodesReport.getHeaderStats}
        />
      </TooltipProvider>
    )

    expect(getStat('Warnings')).toHaveTextContent('0')
    expect(getStat('Errors')).toHaveTextContent('1,200')
  })

  it('does not show stats when the chart does not provide them', () => {
    render(
      <TooltipProvider>
        <ChartHeader title="Edge Function Invocations" syncId={SYNC_ID} data={data} />
      </TooltipProvider>
    )

    expect(screen.queryByText('Warnings')).not.toBeInTheDocument()
    expect(screen.queryByText('Errors')).not.toBeInTheDocument()
  })
})
