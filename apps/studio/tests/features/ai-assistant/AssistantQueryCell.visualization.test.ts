import { describe, expect, it } from 'vitest'

import {
  getAssistantQueryDisplay,
  inferAssistantChartDisplay,
  isChartableAssistantSql,
} from '@/components/ui/AIAssistantPanel/AssistantQueryCell.utils'

describe('getAssistantQueryDisplay', () => {
  it('infers a chart from chartable rows when the assistant did not pick axes', () => {
    expect(
      getAssistantQueryDisplay({
        rows: [
          { hour: '2024-01-01T00:00:00Z', count: 3 },
          { hour: '2024-01-01T01:00:00Z', count: 8 },
        ],
      })
    ).toMatchObject({
      view: 'chart',
      chart: { type: 'line', x_column: 'hour', y_series: ['count'] },
    })
  })

  it('defaults aggregating SQL to a chart before rows arrive', () => {
    expect(
      getAssistantQueryDisplay({
        sql: 'select toStartOfHour(timestamp) as hour, count() as count from logs group by hour',
      })
    ).toEqual({ view: 'chart', chart: undefined })
  })

  it('falls back to a table when aggregate rows cannot produce chart axes', () => {
    expect(
      getAssistantQueryDisplay({
        sql: 'select count() as count from logs',
        rows: [{ count: 42 }],
      })
    ).toEqual({ view: 'table', chart: undefined })
  })
})

describe('inferAssistantChartDisplay', () => {
  it('returns a table when there are no rows or only one column', () => {
    expect(inferAssistantChartDisplay([])).toEqual({ view: 'table', chart: undefined })
    expect(inferAssistantChartDisplay([{ count: 1 }])).toEqual({ view: 'table', chart: undefined })
  })

  it('uses a line chart for a time column plus a metric', () => {
    expect(
      inferAssistantChartDisplay([
        { timestamp: '2024-06-20T14:00:00Z', count: 4 },
        { timestamp: '2024-06-20T15:00:00Z', count: 9 },
      ])
    ).toMatchObject({
      view: 'chart',
      chart: { type: 'line', x_column: 'timestamp', y_series: ['count'] },
    })
  })

  it('uses a bar chart for a categorical column plus a metric', () => {
    expect(
      inferAssistantChartDisplay([
        { method: 'GET', count: 12 },
        { method: 'POST', count: 3 },
      ])
    ).toMatchObject({
      view: 'chart',
      chart: { type: 'bar', x_column: 'method', y_series: ['count'] },
    })
  })

  it('keeps raw log dumps as a table', () => {
    expect(
      inferAssistantChartDisplay([
        { timestamp: '2024-06-20T14:00:00Z', event_message: 'connection reset' },
        { timestamp: '2024-06-20T14:01:00Z', event_message: 'timeout' },
      ])
    ).toEqual({ view: 'table', chart: undefined })
  })
})

describe('isChartableAssistantSql', () => {
  it('detects aggregations and ignores commented-out matches', () => {
    expect(isChartableAssistantSql('select count() from logs')).toBe(true)
    expect(isChartableAssistantSql('select status, count() from logs group by status')).toBe(true)
    expect(
      isChartableAssistantSql('-- count of errors\nselect timestamp, event_message from logs')
    ).toBe(false)
  })
})
