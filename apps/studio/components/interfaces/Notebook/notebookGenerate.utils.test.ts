import { describe, expect, it, vi } from 'vitest'

import { generatedNotebookBlocksToLayout } from './notebookGenerate.utils'

describe('generatedNotebookBlocksToLayout', () => {
  it('maps generated blocks to embedded SQL layout blocks', () => {
    const createId = vi
      .fn()
      .mockReturnValueOnce('block-1')
      .mockReturnValueOnce('block-2')
      .mockReturnValueOnce('block-3')

    const layout = generatedNotebookBlocksToLayout(
      [
        {
          label: 'Daily signups',
          sql: "select date_trunc('day', created_at) as day, count(*) as signups from users group by 1",
          query_source: 'database',
          logs_time_range: null,
          result_config: {
            view: 'chart',
            chart_type: 'line',
            x_key: 'day',
            y_key: 'signups',
            cumulative: false,
          },
        },
        {
          label: 'Recent rows',
          sql: 'select * from users limit 100',
          query_source: 'database',
          logs_time_range: null,
          result_config: {
            view: 'table',
            chart_type: 'bar',
            x_key: '',
            y_key: '',
            cumulative: false,
          },
        },
        {
          label: 'Error rate',
          sql: 'select count(*) from logs',
          query_source: 'logs',
          logs_time_range: 'Last 24 hours',
          result_config: {
            view: 'chart',
            chart_type: 'bar',
            x_key: 'hour',
            y_key: 'errors',
            cumulative: false,
          },
        },
      ],
      createId
    )

    expect(layout).toHaveLength(3)
    expect(layout[0]).toMatchObject({
      id: 'block-1',
      label: 'Daily signups',
      y: 0,
      chart_type: 'line',
      chartConfig: { view: 'chart', type: 'line', xKey: 'day', yKey: 'signups' },
      sql: { query_source: 'database' },
    })
    expect(layout[1]).toMatchObject({
      id: 'block-2',
      label: 'Recent rows',
      y: 1,
      chartConfig: { view: 'table', xKey: '', yKey: '' },
    })
    expect(layout[2]).toMatchObject({
      id: 'block-3',
      label: 'Error rate',
      y: 2,
      sql: { query_source: 'logs' },
    })
    expect(layout[2].sql?.logs_date_picker_value).toMatchObject({
      isHelper: true,
      text: 'Last 24 hours',
    })
    expect(String(layout[0].sql?.unchecked_sql)).toContain('signups')
  })
})
