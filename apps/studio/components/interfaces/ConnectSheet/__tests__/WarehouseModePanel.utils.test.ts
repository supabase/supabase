import { describe, expect, test } from 'vitest'

import {
  buildWarehouseSetupTargets,
  getSchemaTableKey,
  getSelectedTableCount,
  isSecretWarehouseCatalogField,
  isSelectableWarehouseSchema,
  maskSecretValue,
  MASKED_SECRET_PLACEHOLDER,
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

  test('includes public and other user schemas', () => {
    expect(isSelectableWarehouseSchema('public')).toBe(true)
    expect(isSelectableWarehouseSchema('auth')).toBe(true)
    expect(isSelectableWarehouseSchema('storage')).toBe(true)
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

describe('WarehouseModePanel.utils:isSecretWarehouseCatalogField', () => {
  test('treats catalog_url as secret', () => {
    expect(isSecretWarehouseCatalogField('catalog_url')).toBe(true)
  })

  test('treats s3_secret_access_key as secret', () => {
    expect(isSecretWarehouseCatalogField('s3_secret_access_key')).toBe(true)
  })

  test('does not treat s3_endpoint as secret', () => {
    expect(isSecretWarehouseCatalogField('s3_endpoint')).toBe(false)
  })

  test('does not treat s3_region as secret', () => {
    expect(isSecretWarehouseCatalogField('s3_region')).toBe(false)
  })

  test('does not treat s3_access_key_id as secret', () => {
    expect(isSecretWarehouseCatalogField('s3_access_key_id')).toBe(false)
  })

  test('does not treat metadata_schema or data_path as secret', () => {
    expect(isSecretWarehouseCatalogField('metadata_schema')).toBe(false)
    expect(isSecretWarehouseCatalogField('data_path')).toBe(false)
  })
})

describe('WarehouseModePanel.utils:maskSecretValue', () => {
  test('returns an empty string for undefined', () => {
    expect(maskSecretValue(undefined)).toBe('')
  })

  test('returns an empty string for null', () => {
    expect(maskSecretValue(null)).toBe('')
  })

  test('returns an empty string for an empty string', () => {
    expect(maskSecretValue('')).toBe('')
  })

  test('returns the masked placeholder for a non-empty value', () => {
    expect(maskSecretValue('super-secret-value')).toBe(MASKED_SECRET_PLACEHOLDER)
  })
})
