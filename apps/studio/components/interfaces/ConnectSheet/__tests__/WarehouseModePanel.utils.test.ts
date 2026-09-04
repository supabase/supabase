import { describe, expect, test } from 'vitest'

import {
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaCheckedState,
  getSchemaTableKey,
  getSelectedTableCount,
  isSelectableWarehouseSchema,
  type SchemaTableSelection,
  type SchemaWithTables,
} from '../WarehouseModePanel/WarehouseModePanel.utils'

describe('WarehouseModePanel.utils:isSelectableWarehouseSchema', () => {
  test('excludes information_schema', () => {
    expect(isSelectableWarehouseSchema('information_schema')).toBe(false)
  })

  test('excludes any schema starting with pg_', () => {
    expect(isSelectableWarehouseSchema('pg_catalog')).toBe(false)
    expect(isSelectableWarehouseSchema('pg_toast')).toBe(false)
  })

  test('excludes Supabase infrastructure schemas', () => {
    // Replicating secrets or internal bookkeeping into a warehouse is never intended
    expect(isSelectableWarehouseSchema('vault')).toBe(false)
    expect(isSelectableWarehouseSchema('pgsodium')).toBe(false)
    expect(isSelectableWarehouseSchema('realtime')).toBe(false)
    expect(isSelectableWarehouseSchema('_realtime')).toBe(false)
    expect(isSelectableWarehouseSchema('cron')).toBe(false)
    expect(isSelectableWarehouseSchema('supabase_migrations')).toBe(false)
    expect(isSelectableWarehouseSchema('extensions')).toBe(false)
  })

  test('includes public and other user schemas', () => {
    expect(isSelectableWarehouseSchema('public')).toBe(true)
    expect(isSelectableWarehouseSchema('analytics')).toBe(true)
  })

  test('includes auth and storage, which hold product data users replicate', () => {
    expect(isSelectableWarehouseSchema('auth')).toBe(true)
    expect(isSelectableWarehouseSchema('storage')).toBe(true)
  })
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

  test('produces a fully checked schema when every table of that schema is published', () => {
    const schemaTables = ['orders', 'customers']
    const selection = buildSelectionFromPublicationTables(
      schemaTables.map((name) => ({ schema: 'public', name }))
    )
    const selectedCount = schemaTables.filter(
      (name) => selection[getSchemaTableKey('public', name)]
    ).length

    expect(getSchemaCheckedState({ selectedCount, totalCount: schemaTables.length })).toBe(true)
  })

  test('produces an indeterminate schema when only some of its tables are published', () => {
    const selection = buildSelectionFromPublicationTables([{ schema: 'public', name: 'orders' }])
    const selectedCount = ['orders', 'customers'].filter(
      (name) => selection[getSchemaTableKey('public', name)]
    ).length

    expect(getSchemaCheckedState({ selectedCount, totalCount: 2 })).toBe('indeterminate')
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
  test('is unchecked when nothing is selected', () => {
    expect(getSchemaCheckedState({ selectedCount: 0, totalCount: 3 })).toBe(false)
  })

  test('is indeterminate when only some tables are selected', () => {
    expect(getSchemaCheckedState({ selectedCount: 1, totalCount: 3 })).toBe('indeterminate')
    expect(getSchemaCheckedState({ selectedCount: 2, totalCount: 3 })).toBe('indeterminate')
  })

  test('is checked when every table is selected', () => {
    expect(getSchemaCheckedState({ selectedCount: 3, totalCount: 3 })).toBe(true)
  })

  test('is unchecked for an empty schema rather than checked', () => {
    expect(getSchemaCheckedState({ selectedCount: 0, totalCount: 0 })).toBe(false)
  })
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

describe('WarehouseModePanel.utils:buildWarehouseSetupTargets', () => {
  test('returns an empty array for an empty selection', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders', 'customers'] }]
    expect(buildWarehouseSetupTargets({}, schemas)).toEqual([])
  })

  test('returns an empty array when there are no schemas', () => {
    expect(buildWarehouseSetupTargets({ 'public.orders': true }, [])).toEqual([])
  })

  test('emits a schema target when every table in that schema is selected', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders', 'customers'] }]
    const selection: SchemaTableSelection = {
      'public.orders': true,
      'public.customers': true,
    }
    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([
      { type: 'schema', schema: 'public' },
    ])
  })

  test('emits per-table targets when only some tables in a schema are selected', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders', 'customers'] }]
    const selection: SchemaTableSelection = {
      'public.orders': true,
      'public.customers': false,
    }
    expect(buildWarehouseSetupTargets(selection, schemas)).toEqual([
      { type: 'table', schema: 'public', name: 'orders' },
    ])
  })

  test('skips schemas with no tables', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'empty_schema', tables: [] }]
    expect(buildWarehouseSetupTargets({ 'empty_schema.foo': true }, schemas)).toEqual([])
  })

  test('skips schemas with no selected tables', () => {
    const schemas: SchemaWithTables[] = [{ schema: 'public', tables: ['orders'] }]
    expect(buildWarehouseSetupTargets({ 'public.orders': false }, schemas)).toEqual([])
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

  test('handles multiple schemas with a mix of full, partial, and no selection', () => {
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
