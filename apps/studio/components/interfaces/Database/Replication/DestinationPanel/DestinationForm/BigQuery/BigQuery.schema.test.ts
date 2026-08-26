import { describe, expect, it } from 'vitest'

import { BigQueryPartitionBySchema, BigQueryTableOptionSchema } from './BigQuery.schema'

describe('BigQuery replication schemas', () => {
  it('accepts integer ranges at the JavaScript safe-integer boundary', () => {
    expect(
      BigQueryPartitionBySchema.safeParse({
        kind: 'integer_range',
        column: 'account_id',
        start: Number.MIN_SAFE_INTEGER,
        end: Number.MAX_SAFE_INTEGER,
        interval: 1,
      }).success
    ).toBe(true)
  })

  it('rejects integer ranges that cannot be represented exactly by JavaScript', () => {
    expect(
      BigQueryPartitionBySchema.safeParse({
        kind: 'integer_range',
        column: 'account_id',
        start: 0,
        end: Number.MAX_SAFE_INTEGER + 1,
        interval: 1,
      }).success
    ).toBe(false)
  })

  it('rejects table ids outside the PostgreSQL OID range', () => {
    expect(BigQueryTableOptionSchema.safeParse({ tableId: 4_294_967_296 }).success).toBe(false)
  })
})
