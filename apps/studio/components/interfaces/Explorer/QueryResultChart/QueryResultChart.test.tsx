import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { QueryResultData } from '../ExplorerQuery/ExplorerQuery.types'
import { QueryResultChart } from './index'

const data: QueryResultData = {
  columns: [
    { key: 'week', dataType: 'date' },
    { key: 'count', label: 'Total count', dataType: 'int8' },
  ],
  rows: [
    { week: '2026-08-03', count: '0' },
    { week: '2026-08-10', count: '12' },
  ],
}

describe('QueryResultChart', () => {
  it('renders a successful empty state', () => {
    render(
      <QueryResultChart
        data={{ ...data, rows: [] }}
        config={{ type: 'bar', xKey: 'week', yKey: 'count' }}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Success. No rows returned')
  })

  it('validates configured columns before rendering', () => {
    render(
      <QueryResultChart data={data} config={{ type: 'line', xKey: 'missing', yKey: 'count' }} />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Select valid X and Y columns')
  })

  it('falls back from log scale for non-positive values', () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 600,
      top: 0,
      width: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const { container } = render(
      <QueryResultChart
        data={data}
        config={{ type: 'bar', xKey: 'week', yKey: 'count', logScale: true, showGrid: true }}
      />
    )

    expect(container.querySelector('[data-slot="query-result-chart"]')).toBeInTheDocument()
    expect(container.querySelector('.recharts-xAxis')).toBeInTheDocument()
    expect(container.querySelector('.recharts-yAxis')).toBeInTheDocument()
    expect(container.querySelector('.recharts-cartesian-grid')).toBeInTheDocument()
    expect(screen.getByText(/Log scale is unavailable/)).toBeInTheDocument()
    expect(container.querySelector('[data-chart] style')).toHaveTextContent(
      '--color-queryValue: hsl(var(--chart-1));'
    )

    rectSpy.mockRestore()
  })
})
