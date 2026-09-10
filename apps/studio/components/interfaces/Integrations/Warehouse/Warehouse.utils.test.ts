import { describe, expect, test } from 'vitest'

import {
  buildRetryTargets,
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  getSchemaCheckedState,
  getSchemaTableKey,
  getSelectedTableCount,
  isPipelineLimitError,
  isSelectableWarehouseSchema,
  isWarehouseProvisioned,
  isWarehouseSettingUp,
  type SchemaTableSelection,
  type SchemaWithTables,
} from './Warehouse.utils'
import { WAREHOUSE_METADATA_SCHEMA } from '@/lib/warehouse'

describe('Warehouse.utils:isSelectableWarehouseSchema', () => {
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

  test('excludes Supabase-managed product schemas rejected by Warehouse replication', () => {
    expect(isSelectableWarehouseSchema('auth')).toBe(false)
    expect(isSelectableWarehouseSchema('storage')).toBe(false)
  })

  test("excludes the Warehouse's own DuckLake catalog schema", () => {
    // Replicating the catalog that describes the Warehouse would feed it its own metadata
    expect(isSelectableWarehouseSchema(WAREHOUSE_METADATA_SCHEMA)).toBe(false)
    expect(isSelectableWarehouseSchema('ducklake')).toBe(false)
  })

  test('includes schemas whose names merely resemble the catalog schema', () => {
    expect(isSelectableWarehouseSchema('ducklake_staging')).toBe(true)
    expect(isSelectableWarehouseSchema('my_ducklake')).toBe(true)
  })
})

describe('Warehouse.utils:buildSelectionFromPublicationTables', () => {
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

describe('Warehouse.utils:getSchemaCheckedState', () => {
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

describe('Warehouse.utils:getSchemaTableKey', () => {
  test('joins schema and table with a dot', () => {
    expect(getSchemaTableKey('public', 'orders')).toBe('public.orders')
  })
})

describe('Warehouse.utils:getSelectedTableCount', () => {
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

describe('Warehouse.utils:buildWarehouseSetupTargets', () => {
  // The API replaces the previous selection with whatever is sent, so an empty result tears
  // Warehouse down rather than being a no-op. Callers must not submit it unintentionally.
  test('returns an empty array for an empty selection, which is the teardown payload', () => {
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

describe('Warehouse.utils:isWarehouseProvisioned', () => {
  test('is true only once setup completes', () => {
    expect(isWarehouseProvisioned('complete')).toBe(true)
  })

  test.each(['not_started', 'setting_up', 'copying', 'error'] as const)(
    'is false while status is %s',
    (status) => {
      expect(isWarehouseProvisioned(status)).toBe(false)
    }
  )

  test('is false before the status has loaded', () => {
    expect(isWarehouseProvisioned(undefined)).toBe(false)
  })
})

describe('Warehouse.utils:isWarehouseSettingUp', () => {
  test.each(['setting_up', 'copying'] as const)('is true while status is %s', (status) => {
    expect(isWarehouseSettingUp(status)).toBe(true)
  })

  test.each(['not_started', 'complete', 'error'] as const)(
    'is false while status is %s',
    (status) => {
      expect(isWarehouseSettingUp(status)).toBe(false)
    }
  )

  test('is false before the status has loaded', () => {
    expect(isWarehouseSettingUp(undefined)).toBe(false)
  })
})

describe('Warehouse.utils:buildRetryTargets', () => {
  test('maps recorded tables back to individual targets', () => {
    expect(
      buildRetryTargets([
        { schema: 'public', name: 'orders' },
        { schema: 'auth', name: 'users' },
      ])
    ).toEqual([
      { type: 'table', schema: 'public', name: 'orders' },
      { type: 'table', schema: 'auth', name: 'users' },
    ])
  })

  test('returns an empty list when the status recorded no tables', () => {
    expect(buildRetryTargets([])).toEqual([])
    expect(buildRetryTargets()).toEqual([])
  })
})

describe('Warehouse.utils:isPipelineLimitError', () => {
  test('recognises the replication API cap regardless of the limit', () => {
    expect(isPipelineLimitError('This project has reached its maximum of 1 pipelines')).toBe(true)
    expect(isPipelineLimitError('This project has reached its maximum of 12 pipelines')).toBe(true)
  })

  test('ignores unrelated failures', () => {
    expect(isPipelineLimitError('Project must be active and healthy.')).toBe(false)
    expect(isPipelineLimitError('The Pipelines API is not configured')).toBe(false)
    expect(isPipelineLimitError('')).toBe(false)
    expect(isPipelineLimitError(undefined)).toBe(false)
  })
})
