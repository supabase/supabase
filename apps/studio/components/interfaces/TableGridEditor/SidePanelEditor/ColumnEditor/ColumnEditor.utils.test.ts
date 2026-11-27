import { describe, expect, it } from 'vitest'

import type { ColumnField } from '../SidePanelEditor.types'
import { generateCreateColumnPayload, isIntegerType } from './ColumnEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'

const table = { schema: 'public', name: 'visits' } as RetrieveTableResult

const createColumnField = (overrides: Partial<ColumnField> = {}): ColumnField => ({
  id: 'col-1',
  name: 'state',
  table: 'visits',
  schema: 'public',
  format: 'text',
  check: null,
  comment: null,
  defaultValue: null,
  isNullable: true,
  isUnique: false,
  isArray: false,
  isIdentity: false,
  isPrimaryKey: false,
  isNewColumn: true,
  isEncrypted: false,
  ...overrides,
})

describe('isIntegerType', () => {
  it.each(['int2', 'int4', 'int8'])('accepts the built-in integer type %s', (format) => {
    expect(isIntegerType({ format })).toBe(true)
  })

  it.each(['appointment_status', 'interval', 'float8', 'numeric'])(
    'rejects %s, which is not an integer type',
    (format) => {
      expect(isIntegerType({ format })).toBe(false)
    }
  )

  it('rejects a user-defined type named like an integer in another schema', () => {
    expect(isIntegerType({ format: 'int4', formatSchema: 'billing' })).toBe(false)
  })
})

describe('generateCreateColumnPayload', () => {
  it('creates an identity column for a built-in integer type', () => {
    const payload = generateCreateColumnPayload(
      table,
      createColumnField({ format: 'int8', isIdentity: true })
    )

    expect(payload.isIdentity).toBe(true)
    // Postgres assigns identity values, so nullability and a default are not sent
    expect(payload).not.toHaveProperty('isNullable')
    expect(payload).not.toHaveProperty('defaultValue')
  })

  it('does not create an identity column for an enum whose name contains "int"', () => {
    const payload = generateCreateColumnPayload(
      table,
      createColumnField({ format: 'appointment_status', isIdentity: true })
    )

    expect(payload.isIdentity).toBe(false)
    expect(payload.isNullable).toBe(true)
    expect(payload.defaultValue).toBeNull()
  })
})
