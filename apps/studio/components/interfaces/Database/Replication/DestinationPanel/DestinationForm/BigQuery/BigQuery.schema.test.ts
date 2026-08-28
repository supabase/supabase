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

  it('allows a selected table with no partitioning or clustering', () => {
    expect(BigQueryTableOptionSchema.safeParse({ tableId: 1 }).success).toBe(true)
  })

  it('allows an unfinished time-column partition so save can omit it', () => {
    expect(
      BigQueryTableOptionSchema.safeParse({
        tableId: 1,
        partitionBy: { kind: 'time_column', column: '', granularity: 'day' },
      }).success
    ).toBe(true)
  })

  it('requires the integer range end to be greater than the start', () => {
    const result = BigQueryTableOptionSchema.safeParse({
      tableId: 1,
      partitionBy: { kind: 'integer_range', column: 'shard', start: 10, end: 10, interval: 1 },
    })

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ['partitionBy', 'end'],
        message: 'End must be greater than start.',
      })
    )
  })

  it('requires a positive integer range interval', () => {
    const result = BigQueryTableOptionSchema.safeParse({
      tableId: 1,
      partitionBy: { kind: 'integer_range', column: 'shard', start: 0, end: 100, interval: 0 },
    })

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ['partitionBy', 'interval'],
        message: 'Interval must be greater than 0.',
      })
    )
  })

  it('allows at most four clustering columns', () => {
    expect(
      BigQueryTableOptionSchema.safeParse({
        tableId: 1,
        clusterBy: ['one', 'two', 'three', 'four'],
      }).success
    ).toBe(true)

    const result = BigQueryTableOptionSchema.safeParse({
      tableId: 1,
      clusterBy: ['one', 'two', 'three', 'four', 'five'],
    })

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ['clusterBy'],
        message: 'Select up to 4 clustering columns',
      })
    )
  })
})
