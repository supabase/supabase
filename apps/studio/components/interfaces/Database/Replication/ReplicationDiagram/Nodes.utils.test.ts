import { describe, expect, it } from 'vitest'

import { getReplicationDestinationType } from './Nodes.utils'

describe('getReplicationDestinationType', () => {
  it('returns BigQuery for big_query configs', () => {
    expect(getReplicationDestinationType({ big_query: {} })).toBe('BigQuery')
  })

  it('returns Analytics Bucket for iceberg configs', () => {
    expect(getReplicationDestinationType({ iceberg: {} })).toBe('Analytics Bucket')
  })

  it('returns DuckLake for ducklake configs', () => {
    expect(getReplicationDestinationType({ ducklake: {} })).toBe('DuckLake')
  })

  it('returns undefined for unknown or missing configs', () => {
    expect(getReplicationDestinationType({})).toBeUndefined()
    expect(getReplicationDestinationType(undefined)).toBeUndefined()
  })
})
