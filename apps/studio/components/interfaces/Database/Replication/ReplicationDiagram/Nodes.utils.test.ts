import { describe, expect, it } from 'vitest'

import { getReplicationDestinationType } from './Nodes.utils'

describe('getReplicationDestinationType', () => {
  it.each([
    ['big_query', 'BigQuery'],
    ['ducklake', 'DuckLake'],
    ['snowflake', 'Snowflake'],
    ['clickhouse', 'ClickHouse'],
    ['unknown', 'Unknown'],
  ])('maps %s configs to %s', (key, expected) => {
    expect(getReplicationDestinationType({ [key]: {} })).toBe(expected)
  })

  it('renders unrecognized configurations anonymously', () => {
    expect(getReplicationDestinationType({ iceberg: {} })).toBe('Unknown')
    expect(getReplicationDestinationType({})).toBe('Unknown')
  })

  it('returns undefined while the configuration is missing', () => {
    expect(getReplicationDestinationType(undefined)).toBeUndefined()
  })
})
