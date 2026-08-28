import { describe, expect, it } from 'vitest'

import {
  defaultPartitionByForKind,
  getBigQueryValidationIssues,
  parseIntegerInput,
  shortenPgType,
} from './BigQuery.utils'

describe('getBigQueryValidationIssues', () => {
  const validData = {
    projectId: 'my-project',
    datasetId: 'analytics',
    serviceAccountKey: '{}',
  }

  it('returns no issues when all required fields are set', () => {
    expect(getBigQueryValidationIssues(validData)).toEqual([])
  })

  it('flags blank required fields', () => {
    expect(
      getBigQueryValidationIssues({ projectId: '', datasetId: '  ', serviceAccountKey: '{}' })
    ).toEqual([
      { path: 'projectId', message: 'Project ID is required.' },
      { path: 'datasetId', message: 'Dataset ID is required.' },
    ])
  })

  it('skips the service account key when secrets are optional (edit mode)', () => {
    expect(
      getBigQueryValidationIssues(
        { ...validData, serviceAccountKey: '' },
        { secretsOptional: true }
      )
    ).toEqual([])
  })
})

describe('shortenPgType', () => {
  it('shortens known verbose type names to their standard alias', () => {
    expect(shortenPgType('timestamp with time zone')).toBe('timestamptz')
    expect(shortenPgType('timestamp without time zone')).toBe('timestamp')
    expect(shortenPgType('character varying')).toBe('varchar')
    expect(shortenPgType('double precision')).toBe('float8')
  })

  it('returns unrecognized types unchanged', () => {
    expect(shortenPgType('bigint')).toBe('bigint')
    expect(shortenPgType('jsonb')).toBe('jsonb')
  })
})

describe('defaultPartitionByForKind', () => {
  it('returns undefined for "none"', () => {
    expect(defaultPartitionByForKind('none')).toBeUndefined()
  })

  it('defaults time_column with an empty column and day granularity', () => {
    expect(defaultPartitionByForKind('time_column')).toEqual({
      kind: 'time_column',
      column: '',
      granularity: 'day',
    })
  })

  it('defaults integer_range with a 0-100 range and interval of 10', () => {
    expect(defaultPartitionByForKind('integer_range')).toEqual({
      kind: 'integer_range',
      column: '',
      start: 0,
      end: 100,
      interval: 10,
    })
  })

  it('defaults ingestion_time with day granularity', () => {
    expect(defaultPartitionByForKind('ingestion_time')).toEqual({
      kind: 'ingestion_time',
      granularity: 'day',
    })
  })
})

describe('parseIntegerInput', () => {
  it('parses a valid integer string', () => {
    expect(parseIntegerInput('42', 0)).toBe(42)
  })

  it('parses a negative number', () => {
    expect(parseIntegerInput('-5', 0)).toBe(-5)
  })

  it('keeps the previous value for an empty string', () => {
    expect(parseIntegerInput('', 7)).toBe(7)
  })

  it('keeps the previous value for whitespace-only input', () => {
    expect(parseIntegerInput('   ', 7)).toBe(7)
  })

  it('keeps the previous value for non-numeric input', () => {
    expect(parseIntegerInput('abc', 7)).toBe(7)
  })

  it('keeps the previous value while a negative sign is typed alone', () => {
    expect(parseIntegerInput('-', 7)).toBe(7)
  })
})
