import { describe, expect, it } from 'vitest'

import {
  getCumulativeSqlChartRows,
  getSqlEditorXKeyFormat,
  sqlRowsToChartTicks,
} from './sqlEditorChart.utils'

describe('sqlEditorChart.utils', () => {
  it('detects date x-axis values', () => {
    expect(getSqlEditorXKeyFormat('2024-01-01T00:00:00Z')).toBe('date')
  })

  it('builds cumulative rows', () => {
    const rows = getCumulativeSqlChartRows(
      {
        rows: [
          { category: 'a', total: 1 },
          { category: 'b', total: 2 },
        ],
      },
      {
        type: 'bar',
        cumulative: true,
        xKey: 'category',
        yKey: 'total',
        showLabels: false,
        showGrid: false,
      }
    )

    expect(rows).toEqual([
      { category: 'a', total: 1 },
      { category: 'b', total: 3 },
    ])
  })

  it('maps date rows to chart ticks', () => {
    const ticks = sqlRowsToChartTicks(
      [{ created_at: '2024-06-01T12:00:00Z', count: 4 }],
      'created_at',
      'count',
      'date'
    )

    expect(ticks[0].count).toBe(4)
    expect(ticks[0].timestamp).toContain('2024-06-01')
  })

  it('preserves categorical labels for non-date axes', () => {
    const ticks = sqlRowsToChartTicks(
      [
        { category: 'alpha', total: 1 },
        { category: 'beta', total: 2 },
      ],
      'category',
      'total',
      'string'
    )

    expect(ticks).toHaveLength(2)
    expect(ticks[0]._xLabel).toBe('alpha')
    expect(ticks[1]._xLabel).toBe('beta')
  })
})
