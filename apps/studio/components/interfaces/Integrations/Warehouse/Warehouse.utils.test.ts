import { describe, expect, test } from 'vitest'

import {
  buildSchemasWithTables,
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaCheckedState,
  getSchemaTableKey,
  getSelectedTableCount,
  hasSelectionChanged,
  isSelectableWarehouseSchema,
  type SchemaTableSelection,
  type SchemaWithTables,
} from './Warehouse.utils'
import { WAREHOUSE_METADATA_SCHEMA } from '@/lib/warehouse'

describe('WarehouseModePanel.utils:isSelectableWarehouseSchema', () => {
  // Replicating system catalogs, secrets, internal bookkeeping, or the Warehouse's own DuckLake
  // catalog into a warehouse is never intended.
  test.each([
    'information_schema',
    'pg_catalog',
    'pg_toast',
    'vault',
    'pgsodium',
    'realtime',
    '_realtime',
    'cron',
    'supabase_migrations',
    'extensions',
    WAREHOUSE_METADATA_SCHEMA,
    'ducklake',
  ])('excludes %s', (schema) => {
    expect(isSelectableWarehouseSchema(schema)).toBe(false)
  })

  // auth and storage hold product data users replicate; ducklake_* merely resemble the catalog.
  test.each(['public', 'analytics', 'auth', 'storage', 'ducklake_staging', 'my_ducklake'])(
    'includes %s',
    (schema) => {
      expect(isSelectableWarehouseSchema(schema)).toBe(true)
    }
  )
})

describe('WarehouseModePanel.utils:buildSelectionFromPublicationTables', () => {
  test('returns an empty selection when the publication has no tables', () => {
    expect(buildSelectionFromPublicationTables([])).toEqual({})
  })

  test('marks every publication table as selected', () => {
    expect(
      buildSelectionFromPublicationTables([
        { schema: 'public', name: 'orders' },
        { schema: 'auth', name: 'users' },
      ])
    ).toEqual({ 'public.orders': true, 'auth.users': true })
  })

  test('round-trips through buildWarehouseSetupTargets as a schema target when fully published', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders', 'customers'] }]
    const selection = buildSelectionFromPublicationTables([
      { schema: 'public', name: 'orders' },
      { schema: 'public', name: 'customers' },
    ])

    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([
      { type: 'schema', schema: 'public' },
    ])
  })
})

describe('WarehouseModePanel.utils:getSchemaCheckedState', () => {
  test.each([
    { selectedCount: 0, totalCount: 3, expected: false },
    { selectedCount: 1, totalCount: 3, expected: 'indeterminate' },
    { selectedCount: 2, totalCount: 3, expected: 'indeterminate' },
    { selectedCount: 3, totalCount: 3, expected: true },
    // An empty schema is unchecked rather than checked
    { selectedCount: 0, totalCount: 0, expected: false },
  ])(
    '$selectedCount of $totalCount selected is $expected',
    ({ selectedCount, totalCount, expected }) => {
      expect(getSchemaCheckedState({ selectedCount, totalCount })).toBe(expected)
    }
  )
})

describe('WarehouseModePanel.utils:getSchemaTableKey', () => {
  test('joins schema and table with a dot', () => {
    expect(getSchemaTableKey('public', 'orders')).toBe('public.orders')
  })
})

describe('WarehouseModePanel.utils:getSelectedTableCount', () => {
  test('returns 0 for an empty selection', () => {
    expect(getSelectedTableCount({})).toBe(0)
  })

  test('counts only truthy entries', () => {
    const selection: SchemaTableSelection = {
      'public.orders': true,
      'public.customers': false,
      'public.events': true,
    }
    expect(getSelectedTableCount(selection)).toBe(2)
  })
})

describe('WarehouseModePanel.utils:hasSelectionChanged', () => {
  test('is false for two empty selections', () => {
    expect(hasSelectionChanged({}, {})).toBe(false)
  })

  test('is false when the same tables are selected', () => {
    const initial: SchemaTableSelection = { 'public.orders': true, 'public.customers': false }
    const selection: SchemaTableSelection = { 'public.orders': true }
    expect(hasSelectionChanged(selection, initial)).toBe(false)
  })

  test('is true when a table is added on top of the initial selection', () => {
    const initial: SchemaTableSelection = { 'public.orders': true }
    const selection: SchemaTableSelection = { 'public.orders': true, 'public.customers': true }
    expect(hasSelectionChanged(selection, initial)).toBe(true)
  })

  test('is true when a table is removed from the initial selection', () => {
    const initial: SchemaTableSelection = { 'public.orders': true, 'public.customers': true }
    const selection: SchemaTableSelection = { 'public.orders': true, 'public.customers': false }
    expect(hasSelectionChanged(selection, initial)).toBe(true)
  })

  test('ignores explicit false entries that mirror an absent key', () => {
    const initial: SchemaTableSelection = {}
    const selection: SchemaTableSelection = { 'public.orders': false }
    expect(hasSelectionChanged(selection, initial)).toBe(false)
  })
})

describe('WarehouseModePanel.utils:buildWarehouseSetupTargets', () => {
  test.each<{ case: string; selection: SchemaTableSelection; schemas: SchemaWithTables[] }>([
    {
      case: 'an empty selection',
      selection: {},
      schemas: [{ schema: 'public', tables: ['orders', 'customers'] }],
    },
    { case: 'no schemas', selection: { 'public.orders': true }, schemas: [] },
    {
      case: 'a schema with no tables',
      selection: { 'empty_schema.foo': true },
      schemas: [{ schema: 'empty_schema', tables: [] }],
    },
    {
      case: 'a schema with no selected tables',
      selection: { 'public.orders': false },
      schemas: [{ schema: 'public', tables: ['orders'] }],
    },
  ])('returns no targets for $case', ({ selection, schemas }) => {
    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([])
  })

  test('ignores selection keys that reference tables outside the given schemas', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders'] }]
    const selection: SchemaTableSelection = {
      'public.orders': true,
      'other.table': true,
    }
    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([
      { type: 'schema', schema: 'public' },
    ])
  })

  test('emits schema targets for fully selected schemas and table targets for partial ones', () => {
    const schemas: SchemaWithTables[] = [
      { schema: 'public', tables: ['orders', 'customers'] },
      { schema: 'auth', tables: ['users', 'sessions'] },
      { schema: 'storage', tables: ['objects'] },
    ]
    const selection: SchemaTableSelection = {
      'public.orders': true,
      'public.customers': true,
      'auth.users': true,
      'auth.sessions': false,
      'storage.objects': false,
    }
    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([
      { type: 'schema', schema: 'public' },
      { type: 'table', schema: 'auth', name: 'users' },
    ])
  })
})

describe('WarehouseModePanel.utils:buildSchemasWithTables', () => {
  test('returns an empty array when there are no schemas', () => {
    expect(buildSchemasWithTables([], [{ schema: 'public', name: 'orders' }])).toEqual([])
  })

  test('groups each schema with only its own tables', () => {
    const schemas = [{ name: 'public' }, { name: 'analytics' }]
    const tables = [
      { schema: 'public', name: 'orders' },
      { schema: 'analytics', name: 'events' },
      { schema: 'public', name: 'customers' },
    ]
    expect(buildSchemasWithTables(schemas, tables)).toEqual([
      { schema: 'analytics', tables: ['events'] },
      { schema: 'public', tables: ['orders', 'customers'] },
    ])
  })

  test('keeps schemas that have no tables', () => {
    expect(buildSchemasWithTables([{ name: 'public' }], [])).toEqual([
      { schema: 'public', tables: [] },
    ])
  })

  test('excludes schemas that cannot be replicated', () => {
    const schemas = [
      { name: 'public' },
      { name: 'vault' },
      { name: 'pg_catalog' },
      { name: WAREHOUSE_METADATA_SCHEMA },
      { name: 'auth' },
    ]
    const tables = [
      { schema: 'public', name: 'orders' },
      { schema: 'vault', name: 'secrets' },
      { schema: 'auth', name: 'users' },
    ]
    expect(buildSchemasWithTables(schemas, tables)).toEqual([
      { schema: 'auth', tables: ['users'] },
      { schema: 'public', tables: ['orders'] },
    ])
  })

  test('sorts schemas by name', () => {
    const schemas = [{ name: 'zebra' }, { name: 'public' }, { name: 'analytics' }]
    expect(buildSchemasWithTables(schemas, []).map(({ schema }) => schema)).toEqual([
      'analytics',
      'public',
      'zebra',
    ])
  })
})
