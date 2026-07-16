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

  test('should include both USING and WITH CHECK when both are provided', () => {
    const output = createSQLPolicy(
      mockFormFields({ command: 'UPDATE', check: `bucket_id = 'avatars'` })
    )
    expect(output.statement).toContain(`USING (bucket_id = 'avatars')`)
    expect(output.statement).toContain(`WITH CHECK (bucket_id = 'avatars')`)
  })

  test('should default to the public role when no roles are selected', () => {
    const output = createSQLPolicy(mockFormFields({ roles: [] }))
    expect(output.statement).toContain('TO public')
  })

  test('should join multiple roles with a comma', () => {
    const output = createSQLPolicy(mockFormFields({ roles: ['authenticated', 'anon'] }))
    expect(output.statement).toContain('TO authenticated, anon')
  })

  test('should collapse consecutive whitespace and newlines in the definition', () => {
    const output = createSQLPolicy(
      mockFormFields({ definition: `bucket_id =\n    'avatars'   AND\n  auth.uid() IS NOT NULL` })
    )
    expect(output.statement).toContain(`USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL)`)
  })

  test('should treat an empty original policy object as a create', () => {
    const output = createSQLPolicy(mockFormFields(), {} as PGPolicy)
    expect(output.statement).toContain('CREATE POLICY')
  })
})

describe('StoragePolicies.utils: createSQLPolicy (update)', () => {
  test('should return an empty object when nothing changed', () => {
    const output = createSQLPolicy(mockFormFields(), mockOriginalPolicy())
    expect(output).toStrictEqual({})
  })

  test('should return an empty object when the definition differs only by whitespace', () => {
    const output = createSQLPolicy(
      mockFormFields({ definition: `bucket_id =    'avatars'` }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({})
  })

  test('should generate an ALTER POLICY statement wrapped in a transaction when the definition changed', () => {
    const output = createSQLPolicy(
      mockFormFields({ definition: `bucket_id = 'logos'` }),
      mockOriginalPolicy()
    )
    expect(output.description).toBe(`Update policy's definition `)
    expect(output.statement).toBe(
      [
        'BEGIN;',
        `  ALTER POLICY "My policy" ON "storage"."objects" USING (bucket_id = 'logos');`,
        'COMMIT;',
      ].join('\n')
    )
  })

  test('should only include ALTER statements for the fields that changed', () => {
    const output = createSQLPolicy(
      mockFormFields({ definition: `bucket_id = 'logos'`, roles: ['authenticated'] }),
      mockOriginalPolicy()
    )
    expect(output.description).toBe(`Update policy's definition and roles `)
    expect(output.statement).toBe(
      [
        'BEGIN;',
        `  ALTER POLICY "My policy" ON "storage"."objects" USING (bucket_id = 'logos');`,
        `  ALTER POLICY "My policy" ON "storage"."objects" TO authenticated;`,
        'COMMIT;',
      ].join('\n')
    )
  })

  test('should list all changed fields in the description', () => {
    const output = createSQLPolicy(
      mockFormFields({
        name: 'New name',
        definition: `bucket_id = 'logos'`,
        roles: ['authenticated'],
      }),
      mockOriginalPolicy()
    )
    expect(output.description).toBe(`Update policy's name, definition and roles `)
  })

  test('should default to the public role when roles were cleared', () => {
    const output = createSQLPolicy(
      mockFormFields({ roles: [] }),
      mockOriginalPolicy({ roles: ['authenticated'] })
    )
    expect(output.statement).toContain('TO public;')
  })

  test('should generate a RENAME statement referencing the original policy name', () => {
    const output = createSQLPolicy(mockFormFields({ name: 'New name' }), mockOriginalPolicy())
    expect(output.statement).toBe(
      [
        'BEGIN;',
        `  ALTER POLICY "My policy" ON "storage"."objects" RENAME TO "New name";`,
        'COMMIT;',
      ].join('\n')
    )
  })

  test('should reference the original policy name in other ALTER statements when renaming', () => {
    const output = createSQLPolicy(
      mockFormFields({ name: 'New name', definition: `bucket_id = 'logos'` }),
      mockOriginalPolicy()
    )
    expect(output.statement).toBe(
      [
        'BEGIN;',
        `  ALTER POLICY "My policy" ON "storage"."objects" USING (bucket_id = 'logos');`,
        `  ALTER POLICY "My policy" ON "storage"."objects" RENAME TO "New name";`,
        'COMMIT;',
      ].join('\n')
    )
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

  // Characterizes current behavior: clearing a definition sets the payload field to
  // undefined, which is dropped during JSON serialization — so the clear is never
  // persisted by the API.
  test('should set the definition to undefined when it was cleared', () => {
    const output = createPayloadForUpdatePolicy(
      mockFormFields({ definition: '' }),
      mockOriginalPolicy()
    )
    expect(output).toStrictEqual({ id: 1, definition: undefined })
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
