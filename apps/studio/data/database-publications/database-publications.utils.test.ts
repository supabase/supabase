import { describe, expect, test } from 'vitest'

import { getTablesForPublicationToggle, isTableInPublication } from './database-publications.utils'

const customers = { id: 1, schema: 'public', name: 'customers' }
const auditLog = { id: 2, schema: 'audit', name: 'log_entries' }
const privateProfiles = { id: 3, schema: 'private', name: 'profiles' }

describe('isTableInPublication', () => {
  test('treats every table as enabled for an all-tables publication', () => {
    expect(isTableInPublication({ tables: null }, customers.id)).toBe(true)
  })

  test('checks table membership for an explicit publication', () => {
    const publication = { tables: [customers] }

    expect(isTableInPublication(publication, customers.id)).toBe(true)
    expect(isTableInPublication(publication, auditLog.id)).toBe(false)
  })
})

describe('getTablesForPublicationToggle', () => {
  test('preserves all-tables mode when the table is already enabled', () => {
    expect(
      getTablesForPublicationToggle({
        publication: { tables: null },
        table: customers,
        enabled: true,
      })
    ).toBeUndefined()
  })

  test('retains tables from every schema when disabling one from all-tables mode', () => {
    expect(
      getTablesForPublicationToggle({
        publication: { tables: null },
        table: customers,
        enabled: false,
        allTables: [customers, auditLog, privateProfiles],
      })
    ).toEqual(['audit.log_entries', 'private.profiles'])
  })

  test('requires the complete table list before leaving all-tables mode', () => {
    expect(() =>
      getTablesForPublicationToggle({
        publication: { tables: null },
        table: customers,
        enabled: false,
      })
    ).toThrow('allTables is required when updating an all-tables publication')
  })

  test('adds a table to an explicit publication', () => {
    expect(
      getTablesForPublicationToggle({
        publication: { tables: [customers] },
        table: auditLog,
        enabled: true,
      })
    ).toEqual(['public.customers', 'audit.log_entries'])
  })
})
