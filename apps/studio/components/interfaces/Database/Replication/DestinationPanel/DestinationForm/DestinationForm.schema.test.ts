import { describe, expect, it } from 'vitest'

import { DestinationPanelFormSchema } from './DestinationForm.schema'

const requiredFields = {
  name: 'BigQuery warehouse',
  publicationName: 'analytics_publication',
  tableSyncCopyMode: 'include_all_tables' as const,
  tableSyncCopyTableIds: [],
  maxFillMs: 10_000,
  maxTableSyncWorkers: 4,
  maxCopyConnectionsPerTable: 4,
  connectionPoolSize: 4,
}

const requiredNumberFields = [
  { field: 'maxFillMs', message: 'Batch wait time must be 0 or greater.' },
  { field: 'maxTableSyncWorkers', message: 'Max table sync workers must be greater than 0.' },
  {
    field: 'maxCopyConnectionsPerTable',
    message: 'Max copy connections per table must be greater than 0.',
  },
  { field: 'connectionPoolSize', message: 'Connection pool size must be greater than 0.' },
] as const

describe('DestinationPanelFormSchema', () => {
  it.each(requiredNumberFields)('uses the existing error for an empty $field field', (testCase) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      [testCase.field]: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe(testCase.message)
  })

  it.each(requiredNumberFields)('rejects a missing $field field', (testCase) => {
    const { [testCase.field]: _omitted, ...rest } = requiredFields

    const result = DestinationPanelFormSchema.safeParse(rest)

    expect(result.success).toBe(false)
  })

  it('normalizes an empty maximum staleness to undefined', () => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxStalenessMins: '',
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.maxStalenessMins).toBeUndefined()
  })

  it.each([0, 1])('accepts a batch wait time of %i milliseconds', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxFillMs: value,
    })

    expect(result.success).toBe(true)
  })

  it.each([-1, 1.5])('rejects an unsupported batch wait time of %s', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxFillMs: value,
    })

    expect(result.success).toBe(false)
  })

  it.each([1, 65536])('accepts %i table sync workers', (value) => {
    expect(
      DestinationPanelFormSchema.safeParse({ ...requiredFields, maxTableSyncWorkers: value })
        .success
    ).toBe(true)
  })

  it.each([0, 1.5])('rejects an unsupported table sync worker count of %s', (value) => {
    expect(
      DestinationPanelFormSchema.safeParse({ ...requiredFields, maxTableSyncWorkers: value })
        .success
    ).toBe(false)
  })

  it.each([1, 65536])('accepts %i copy connections per table', (value) => {
    expect(
      DestinationPanelFormSchema.safeParse({
        ...requiredFields,
        maxCopyConnectionsPerTable: value,
      }).success
    ).toBe(true)
  })

  it.each([0, 1.5])('rejects an unsupported copy connections per table count of %s', (value) => {
    expect(
      DestinationPanelFormSchema.safeParse({
        ...requiredFields,
        maxCopyConnectionsPerTable: value,
      }).success
    ).toBe(false)
  })

  it('requires the BigQuery connection pool size to be greater than 0', () => {
    expect(
      DestinationPanelFormSchema.safeParse({ ...requiredFields, connectionPoolSize: 0 }).success
    ).toBe(false)
    expect(
      DestinationPanelFormSchema.safeParse({ ...requiredFields, connectionPoolSize: 1 }).success
    ).toBe(true)
  })

  it.each([0, 1, 65536])('accepts a maximum staleness of %i whole minutes', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxStalenessMins: value,
    })

    expect(result.success).toBe(true)
  })

  it.each([-1, 1.5])('rejects an unsupported maximum staleness of %s', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxStalenessMins: value,
    })

    expect(result.success).toBe(false)
  })
})
