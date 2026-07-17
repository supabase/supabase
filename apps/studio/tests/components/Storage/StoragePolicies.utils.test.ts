import type { PGPolicy } from '@supabase/pg-meta'
import { describe, expect, test } from 'vitest'

import type { PolicyFormField } from '@/components/interfaces/Storage/StoragePolicies/StoragePolicies.types'
import {
  createPayloadForCreatePolicy,
  createPayloadForUpdatePolicy,
  createSQLPolicy,
} from '@/components/interfaces/Storage/StoragePolicies/StoragePolicies.utils'

const mockFormFields = (overrides: Partial<PolicyFormField> = {}): PolicyFormField => ({
  name: 'My policy',
  schema: 'storage',
  table: 'objects',
  command: 'SELECT',
  definition: `bucket_id = 'avatars'`,
  check: null,
  roles: [],
  ...overrides,
})

const mockOriginalPolicy = (overrides: Partial<PGPolicy> = {}): PGPolicy =>
  ({
    id: 1,
    schema: 'storage',
    table: 'objects',
    table_id: 100,
    name: 'My policy',
    action: 'PERMISSIVE',
    roles: [],
    command: 'SELECT',
    definition: `bucket_id = 'avatars'`,
    check: null,
    ...overrides,
  }) as PGPolicy

describe('StoragePolicies.utils: createSQLPolicy (create)', () => {
  test('should generate a CREATE POLICY statement with USING for a SELECT policy', () => {
    const output = createSQLPolicy(mockFormFields())
    expect(output.description).toBe(
      'Add policy for the SELECT operation under the policy "My policy"'
    )
    expect(output.statement).toBe(
      [
        `CREATE POLICY "My policy" ON "storage"."objects"`,
        `AS PERMISSIVE FOR SELECT`,
        `TO public`,
        `USING (bucket_id = 'avatars')`,
        ``,
      ].join('\n')
    )
  })

  test('should generate a CREATE POLICY statement with WITH CHECK for an INSERT policy', () => {
    const output = createSQLPolicy(
      mockFormFields({
        command: 'INSERT',
        definition: null,
        check: `bucket_id = 'avatars'`,
        roles: ['authenticated'],
      })
    )
    expect(output.statement).toBe(
      [
        `CREATE POLICY "My policy" ON "storage"."objects"`,
        `AS PERMISSIVE FOR INSERT`,
        `TO authenticated`,
        ``,
        `WITH CHECK (bucket_id = 'avatars')`,
      ].join('\n')
    )
  })
})

describe('StoragePolicies.utils: createSQLPolicy (update)', () => {
  test('should not emit USING () when definition is cleared', () => {
    // Regression: previously emitted `ALTER POLICY ... USING ();` which is
    // invalid SQL. Now the cleared expression is omitted from the statement.
    const output = createSQLPolicy(
      mockFormFields({ command: 'UPDATE', definition: '', check: `bucket_id = 'logos'` }),
      mockOriginalPolicy({ command: 'UPDATE', definition: `bucket_id = 'avatars'`, check: null })
    )
    expect(output.statement).not.toContain('USING ()')
    expect(output.statement).toContain("WITH CHECK (bucket_id = 'logos')")
  })

  test('should not emit WITH CHECK () when check is cleared', () => {
    const output = createSQLPolicy(
      mockFormFields({ command: 'UPDATE', definition: `bucket_id = 'avatars'`, check: '' }),
      mockOriginalPolicy({ command: 'UPDATE', definition: null, check: `bucket_id = 'avatars'` })
    )
    expect(output.statement).not.toContain('WITH CHECK ()')
    expect(output.statement).toContain("USING (bucket_id = 'avatars')")
  })

  test('should return empty object when nothing changed', () => {
    const output = createSQLPolicy(mockFormFields(), mockOriginalPolicy())
    expect(output).toEqual({})
  })

  test('should include only changed fields in the ALTER statement', () => {
    const output = createSQLPolicy(
      mockFormFields({ name: 'New name' }),
      mockOriginalPolicy()
    )
    expect(output.statement).toContain('RENAME TO "New name"')
    expect(output.statement).not.toContain('USING')
    expect(output.statement).not.toContain('WITH CHECK')
  })
})

describe('StoragePolicies.utils: createPayloadForCreatePolicy', () => {
  test('should build a payload with the definition for a SELECT policy', () => {
    const output = createPayloadForCreatePolicy(mockFormFields({ roles: ['authenticated'] }))
    expect(output).toStrictEqual({
      name: 'My policy',
      schema: 'storage',
      table: 'objects',
      action: 'PERMISSIVE',
      command: 'SELECT',
      definition: `bucket_id = 'avatars'`,
      check: undefined,
      roles: ['authenticated'],
    })
  })

  test('should omit roles when none are selected', () => {
    const output = createPayloadForCreatePolicy(mockFormFields({ roles: [] }))
    expect(output.roles).toBeUndefined()
  })

  test('should omit the command when it is null', () => {
    const output = createPayloadForCreatePolicy(mockFormFields({ command: null }))
    expect(output.command).toBeUndefined()
  })

  test('should omit definition and check when they are empty', () => {
    const output = createPayloadForCreatePolicy(mockFormFields({ definition: '', check: null }))
    expect(output.definition).toBeUndefined()
    expect(output.check).toBeUndefined()
  })
})

describe('StoragePolicies.utils: createPayloadForUpdatePolicy', () => {
  test('should return only the policy id when nothing changed', () => {
    const output = createPayloadForUpdatePolicy(mockFormFields(), mockOriginalPolicy())
    expect(output).toStrictEqual({ id: 1 })
  })

  test('should not include the definition when it differs only by whitespace', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ definition: `bucket_id\n  =  'avatars'` }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({ id: 1 })
  })

  test('should include only the changed fields', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ name: 'New name', definition: `bucket_id = 'logos'` }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({
      id: 1,
      name: 'New name',
      definition: `bucket_id = 'logos'`,
    })
  })

  test('should include the check when it changed', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ check: `bucket_id = 'avatars'` }),
      mockOriginalPolicy({ check: null })
    )
    expect(output).toStrictEqual({ id: 1, check: `bucket_id = 'avatars'` })
  })

  // Regression for #48015: clearing a definition must send null (which
  // survives JSON serialization) instead of undefined (which is stripped).
  test('should set the definition to null when it was cleared', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ definition: '' }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({ id: 1, definition: null })
    // Verify the key survives JSON round-trip
    expect(JSON.parse(JSON.stringify(output))).toHaveProperty('definition')
  })

  test('should set the check to null when it was cleared', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ check: '' }),
      mockOriginalPolicy({ check: `bucket_id = 'avatars'` })
    )
    expect(output).toStrictEqual({ id: 1, check: null })
    expect(JSON.parse(JSON.stringify(output))).toHaveProperty('check')
  })

  // Regression for CodeRabbit review: whitespace-only expressions should be
  // treated as empty, since createPayloadForUpdatePolicy trims them to "" and
  // would send null — silently clearing the expression.
  test('should set the definition to null when it is whitespace-only', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ definition: '   ' }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({ id: 1, definition: null })
  })

  test('should set the check to null when it is whitespace-only', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ check: '   ' }),
      mockOriginalPolicy({ check: `bucket_id = 'avatars'` })
    )
    expect(output).toStrictEqual({ id: 1, check: null })
  })

  test('should default to the public role when roles were cleared', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ roles: [] }),
      mockOriginalPolicy({ roles: ['authenticated'] })
    )
    expect(output).toStrictEqual({ id: 1, roles: ['public'] })
  })

  test('should include the new roles when they changed', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ roles: ['anon', 'authenticated'] }),
      mockOriginalPolicy({ roles: ['authenticated'] })
    )
    expect(output).toStrictEqual({ id: 1, roles: ['anon', 'authenticated'] })
  })
})