import { describe, expect, it } from 'vitest'

import { getReplicationDestinationType } from './Nodes.utils'

describe('getReplicationDestinationType', () => {
  it.each([
    ['big_query', 'BigQuery'],
    ['iceberg', 'Analytics Bucket'],
    ['ducklake', 'DuckLake'],
    ['snowflake', 'Snowflake'],
    ['clickhouse', 'ClickHouse'],
  ])('maps %s configs to %s', (key, expected) => {
    expect(getReplicationDestinationType({ [key]: {} })).toBe(expected)
  })

  it('returns undefined for unknown or missing configs', () => {
    expect(getReplicationDestinationType({})).toBeUndefined()
    expect(getReplicationDestinationType(undefined)).toBeUndefined()
  })
})
