import { describe, expect, test } from 'vitest'

import {
  findColumnForeignKeyConstraint,
  getReferencingRecordFilters,
} from './ForeignKeyFormatter.utils'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'

const compositeForeignKey: ForeignKeyConstraint = {
  id: 1,
  constraint_name: 'machine_storage_usage_buckets_org_metering_bucket_fkey',
  deletion_action: 'a',
  update_action: 'a',
  source_id: 10,
  source_schema: 'dcs',
  source_table: 'machine_storage_usage_buckets',
  source_columns: ['org_id', 'org_metering_bucket_id'],
  target_id: 11,
  target_schema: 'dcs',
  target_table: 'org_metering_buckets',
  // Deliberately not in the target table's physical column order
  target_columns: ['org_id', 'bucket_id'],
}

const simpleForeignKey: ForeignKeyConstraint = {
  id: 2,
  constraint_name: 'orders_customer_id_fkey',
  deletion_action: 'a',
  update_action: 'a',
  source_id: 20,
  source_schema: 'public',
  source_table: 'orders',
  source_columns: ['customer_id'],
  target_id: 21,
  target_schema: 'public',
  target_table: 'customers',
  target_columns: ['id'],
}

const bigintColumns = [
  { name: 'org_id', format: 'int8' },
  { name: 'org_metering_bucket_id', format: 'int8' },
]

describe('findColumnForeignKeyConstraint', () => {
  const foreignKeys = [simpleForeignKey, compositeForeignKey]

  test('finds the constraint containing the column for the given table', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys,
        schema: 'dcs',
        table: 'machine_storage_usage_buckets',
        columnName: 'org_metering_bucket_id',
      })
    ).toBe(compositeForeignKey)
  })

  test('finds the constraint for any column of a composite key', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys,
        schema: 'dcs',
        table: 'machine_storage_usage_buckets',
        columnName: 'org_id',
      })
    ).toBe(compositeForeignKey)
  })

  test('ignores constraints from other tables with the same column name', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys,
        schema: 'public',
        table: 'orders',
        columnName: 'org_id',
      })
    ).toBeUndefined()
  })

  test('ignores constraints from the same table name in another schema', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys,
        schema: 'public',
        table: 'machine_storage_usage_buckets',
        columnName: 'org_id',
      })
    ).toBeUndefined()
  })

  test('returns undefined for a column that is not part of any constraint', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys,
        schema: 'public',
        table: 'orders',
        columnName: 'total',
      })
    ).toBeUndefined()
  })

  test('returns undefined when there are no constraints', () => {
    expect(
      findColumnForeignKeyConstraint({
        foreignKeys: [],
        schema: 'public',
        table: 'orders',
        columnName: 'customer_id',
      })
    ).toBeUndefined()
  })
})

describe('getReferencingRecordFilters', () => {
  test('pairs each composite key column with the target column at the same position', () => {
    const filters = getReferencingRecordFilters({
      foreignKey: compositeForeignKey,
      row: { idx: 0, org_id: 2, org_metering_bucket_id: 903 },
      columns: bigintColumns,
    })

    expect(filters).toStrictEqual([
      { column: 'org_id', operator: '=', value: 2 },
      { column: 'bucket_id', operator: '=', value: 903 },
    ])
  })

  test('builds the same filters regardless of which source column was clicked', () => {
    const row = { idx: 0, org_id: 1, org_metering_bucket_id: 901 }
    const filters = getReferencingRecordFilters({
      foreignKey: compositeForeignKey,
      row,
      columns: bigintColumns,
    })

    expect(filters).toStrictEqual([
      { column: 'org_id', operator: '=', value: 1 },
      { column: 'bucket_id', operator: '=', value: 901 },
    ])
  })

  test('builds a single filter for a single-column foreign key', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: simpleForeignKey,
        row: { idx: 0, customer_id: 'abc' },
        columns: [{ name: 'customer_id', format: 'text' }],
      })
    ).toStrictEqual([{ column: 'id', operator: '=', value: 'abc' }])
  })

  test('converts bytea source values to hex', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: simpleForeignKey,
        row: { idx: 0, customer_id: { type: 'Buffer', data: [222, 173, 190, 239] } },
        columns: [{ name: 'customer_id', format: 'bytea' }],
      })
    ).toStrictEqual([{ column: 'id', operator: '=', value: '\\xdeadbeef' }])
  })

  test('keeps non-bytea values untouched when the column format is unknown', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: simpleForeignKey,
        row: { idx: 0, customer_id: 42 },
        columns: [],
      })
    ).toStrictEqual([{ column: 'id', operator: '=', value: 42 }])
  })

  test('returns no filters when any composite key value is null', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: compositeForeignKey,
        row: { idx: 0, org_id: 2, org_metering_bucket_id: null },
        columns: bigintColumns,
      })
    ).toStrictEqual([])
  })

  test('returns no filters when a source value is missing from the row', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: compositeForeignKey,
        row: { idx: 0, org_id: 2 },
        columns: bigintColumns,
      })
    ).toStrictEqual([])
  })

  test('returns no filters when the single key value is null', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: simpleForeignKey,
        row: { idx: 0, customer_id: null },
        columns: [{ name: 'customer_id', format: 'text' }],
      })
    ).toStrictEqual([])
  })

  test('keeps falsy but non-null values such as 0 and empty strings', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: compositeForeignKey,
        row: { idx: 0, org_id: 0, org_metering_bucket_id: '' },
        columns: bigintColumns,
      })
    ).toStrictEqual([
      { column: 'org_id', operator: '=', value: 0 },
      { column: 'bucket_id', operator: '=', value: '' },
    ])
  })

  test('returns no filters when source and target column counts differ', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: { source_columns: ['org_id', 'bucket_id'], target_columns: ['org_id'] },
        row: { idx: 0, org_id: 2, bucket_id: 903 },
        columns: bigintColumns,
      })
    ).toStrictEqual([])
  })

  test('returns no filters for a constraint without columns', () => {
    expect(
      getReferencingRecordFilters({
        foreignKey: { source_columns: [], target_columns: [] },
        row: { idx: 0 },
        columns: [],
      })
    ).toStrictEqual([])
  })
})
