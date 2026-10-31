import { describe, expect, it } from 'vitest'

import { getReplicationDestinationType } from './Nodes.utils'

describe('getReplicationDestinationType', () => {
  it.each([
    ['big_query', 'BigQuery'],
    ['ducklake', 'DuckLake'],
    ['snowflake', 'Snowflake'],
    ['clickhouse', 'ClickHouse'],
  ])('maps %s configs to %s', (key, expected) => {
    expect(getReplicationDestinationType({ [key]: {} })).toBe(expected)
  })

  it('does not recognize retired iceberg configs', () => {
    expect(getReplicationDestinationType({ iceberg: {} })).toBeUndefined()
  })

  it('returns undefined for unknown or missing configs', () => {
    expect(getReplicationDestinationType({})).toBeUndefined()
    expect(getReplicationDestinationType(undefined)).toBeUndefined()
  })
})
