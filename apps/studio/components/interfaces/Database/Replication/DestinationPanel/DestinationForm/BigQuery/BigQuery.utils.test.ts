import { describe, expect, it } from 'vitest'

import {
  defaultPartitionByForKind,
  getBigQueryValidationIssues,
  parseIntegerInput,
  shortenPgType,
} from './BigQuery.utils'

describe('getBigQueryValidationIssues', () => {
  it.each([
    ['empty', ''],
    ['whitespace-only', ' \t\n'],
  ])('returns required-field errors for %s BigQuery settings', (_, value) => {
    expect(
      getBigQueryValidationIssues({
        projectId: value,
        datasetId: value,
        serviceAccountKey: value,
      })
    ).toEqual([
      { path: 'projectId', message: 'Project ID is required.' },
      { path: 'datasetId', message: 'Dataset ID is required.' },
      { path: 'serviceAccountKey', message: 'Service account key is required.' },
    ])
  })

  it('returns no issues for a complete configuration', () => {
    const issues = getBigQueryValidationIssues({
      projectId: 'my-project',
      datasetId: 'my_dataset',
      serviceAccountKey: '{ "type": "service_account" }',
    })

    expect(issues).toEqual([])
  })

  it('rejects invalid JSON in the service account key', () => {
    const issues = getBigQueryValidationIssues({
      projectId: 'my-project',
      datasetId: 'my_dataset',
      serviceAccountKey: '{ "type": "service_account" ',
    })

    expect(issues).toEqual([
      { path: 'serviceAccountKey', message: 'Service account key must be valid JSON.' },
    ])
  })

  it('skips JSON shape checks when validateJson is false', () => {
    const issues = getBigQueryValidationIssues(
      {
        projectId: 'my-project',
        datasetId: 'my_dataset',
        serviceAccountKey: '{ "type": "service_account" ',
      },
      { validateJson: false }
    )

    expect(issues).toEqual([])
  })

  it('rejects non-JSON text in the service account key', () => {
    const issues = getBigQueryValidationIssues({
      projectId: 'my-project',
      datasetId: 'my_dataset',
      serviceAccountKey: 'not-json',
    })

    expect(issues).toEqual([
      { path: 'serviceAccountKey', message: 'Service account key must be valid JSON.' },
    ])
  })

  it('validates JSON when replacing credentials in edit mode', () => {
    const issues = getBigQueryValidationIssues(
      {
        projectId: 'my-project',
        datasetId: 'my_dataset',
        serviceAccountKey: '{ invalid',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([
      { path: 'serviceAccountKey', message: 'Service account key must be valid JSON.' },
    ])
  })

  it('allows an omitted BigQuery service account key in edit mode', () => {
    const issues = getBigQueryValidationIssues(
      {
        projectId: 'my-project',
        datasetId: 'my_dataset',
        serviceAccountKey: '',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
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
  it.each([
    ['42', 42],
    ['-5', -5],
    // Empty, whitespace-only and a lone minus sign (mid-typing) use the empty sentinel
    ['', ''],
    ['   ', ''],
    ['-', ''],
    // Non-numeric input keeps the previous value
    ['abc', 7],
  ])('parses %j as %j', (input, expected) => {
    expect(parseIntegerInput(input, 7)).toBe(expected)
  })
})
