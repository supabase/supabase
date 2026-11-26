import { describe, expect, it } from 'vitest'

import { appendReportCharts } from './CustomReport.utils'
import type { Dashboards } from '@/types'

const createChart = (id: string, overrides: Partial<Dashboards.Chart> = {}): Dashboards.Chart => ({
  id,
  label: id,
  attribute: id as Dashboards.ChartType,
  provider: 'infra-monitoring',
  chart_type: 'bar',
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  ...overrides,
})

describe('appendReportCharts', () => {
  it('places every selected block using the layout including earlier additions', () => {
    const existing = createChart('existing')
    const layout = [existing]
    const charts = [createChart('cpu_usage'), createChart('ram_usage'), createChart('snippet_sql')]

    expect(appendReportCharts(layout, charts)).toEqual([
      existing,
      { ...charts[0], x: 1, y: 0 },
      { ...charts[1], x: 0, y: 1 },
      { ...charts[2], x: 1, y: 1 },
    ])
    expect(layout).toEqual([existing])
  })

  it('preserves existing blocks and ignores duplicate selections', () => {
    const existing = createChart('cpu_usage', { chart_type: 'line', w: 2 })
    const newChart = createChart('ram_usage')

    expect(appendReportCharts([existing], [createChart('cpu_usage'), newChart, newChart])).toEqual([
      existing,
      { ...newChart, y: 1 },
    ])
  })

  it('starts a new row below resized blocks', () => {
    const existing = createChart('cpu_usage', { w: 2, h: 3 })
    const newChart = createChart('ram_usage')

    expect(appendReportCharts([existing], [newChart])).toEqual([existing, { ...newChart, y: 3 }])
  })

  it('fills an open column without overlapping a vertically spanning block', () => {
    const tallChart = createChart('cpu_usage', { x: 1, h: 3 })
    const firstChart = createChart('ram_usage')
    const secondChart = createChart('disk_usage')

    expect(appendReportCharts([tallChart], [firstChart, secondChart])).toEqual([
      tallChart,
      firstChart,
      { ...secondChart, y: 1 },
    ])
  })

  it('does not re-add a snippet with the same ID and a different attribute', () => {
    const existing = createChart('sql', { attribute: 'new_snippet_sql' as Dashboards.ChartType })
    const selected = createChart('sql', { attribute: 'snippet_sql' as Dashboards.ChartType })

    expect(appendReportCharts([existing], [selected])).toEqual([existing])
  })
})
