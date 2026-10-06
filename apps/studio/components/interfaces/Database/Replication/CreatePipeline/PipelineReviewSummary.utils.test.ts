import { describe, expect, test } from 'vitest'

import { describeBigQueryTableLayout } from './PipelineReviewSummary.utils'

describe('describeBigQueryTableLayout', () => {
  test('shows unconfigured layout explicitly', () => {
    expect(describeBigQueryTableLayout({ tableId: 1 })).toBe('No partitioning; No clustering')
  })

  test('shows the partition column, granularity and ordered clustering columns', () => {
    expect(
      describeBigQueryTableLayout({
        tableId: 1,
        partitionBy: { kind: 'time_column', column: 'created_at', granularity: 'month' },
        clusterBy: ['tenant_id', 'status'],
      })
    ).toBe('Partition by created_at (month); Cluster by tenant_id, status')
  })

  test('shows the default ingestion-time granularity', () => {
    expect(
      describeBigQueryTableLayout({ tableId: 1, partitionBy: { kind: 'ingestion_time' } })
    ).toBe('Partition by ingestion time (day); No clustering')
  })

  test('shows integer range boundaries and interval', () => {
    expect(
      describeBigQueryTableLayout({
        tableId: 1,
        partitionBy: { kind: 'integer_range', column: 'id', start: 0, end: 100, interval: 10 },
      })
    ).toBe('Partition by id (range 0 to 100, interval 10); No clustering')
  })
})
