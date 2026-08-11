import { rawSql } from '@supabase/pg-meta'
import { describe, expect, test } from 'vitest'

import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import type { StoragePolicyFormField } from '@/components/interfaces/Storage/Storage.types'
import {
  applyBucketIdToTemplateDefinition,
  createPayloadsForAddPolicy,
  createSQLPolicies,
  deriveAllowedClientLibraryMethods,
  extractBucketNamesFromDefinition,
  formatPoliciesForStorage,
  getPolicyBucketNames,
  UNGROUPED_POLICY_SYMBOL,
  UNKNOWN_BUCKET_SYMBOL,
} from '@/components/interfaces/Storage/Storage.utils'
import type { Bucket } from '@/data/storage/buckets-query'

const mockBucket = (name: string) => ({ name }) as unknown as Bucket

const mockPolicy = (overrides: Partial<Policy> = {}): Policy =>
  ({
    id: 1,
    schema: 'storage',
    table: 'objects',
    table_id: 100,
    name: 'My policy',
    action: 'PERMISSIVE',
    roles: ['public'],
    command: 'SELECT',
    definition: rawSql(`(bucket_id = 'avatars'::text)`),
    check: null,
    ...overrides,
  }) as Policy

const mockPolicyFormFields = (
  overrides: Partial<StoragePolicyFormField> = {}
): StoragePolicyFormField =>
  ({
    name: 'My policy',
    definition: `bucket_id = 'avatars'`,
    allowedOperations: ['SELECT'],
    roles: [],
    ...overrides,
  }) as StoragePolicyFormField

describe('Storage.utils: extractBucketNamesFromDefinition', () => {
  test('should extract the bucket name from a simple definition', () => {
    expect(extractBucketNamesFromDefinition(`(bucket_id = 'avatars'::text)`)).toStrictEqual([
      'avatars',
    ])
  })

  test('should extract the bucket name from a definition with multiple conditions', () => {
    expect(
      extractBucketNamesFromDefinition(
        `((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text))`
      )
    ).toStrictEqual(['avatars'])
  })

  test('should extract every bucket name from an ANY (ARRAY[...]) membership condition', () => {
    expect(
      extractBucketNamesFromDefinition(`(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))`)
    ).toStrictEqual(['avatars', 'logos'])
  })

  test('should extract bucket names from OR conditions across separate equalities', () => {
    expect(
      extractBucketNamesFromDefinition(
        `((bucket_id = 'avatars'::text) OR (bucket_id = 'logos'::text))`
      )
    ).toStrictEqual(['avatars', 'logos'])
  })

  test('should not pick up quoted values from non-bucket conditions', () => {
    expect(
      extractBucketNamesFromDefinition(
        `((auth.role() = 'authenticated'::text) AND (bucket_id = 'logos'::text))`
      )
    ).toStrictEqual(['logos'])
  })

  test('should return no buckets for a negated condition', () => {
    expect(extractBucketNamesFromDefinition(`(bucket_id <> 'avatars'::text)`)).toStrictEqual([])
  })

  test('should return no buckets when there is no bucket_id condition', () => {
    expect(extractBucketNamesFromDefinition('(auth.uid() IS NOT NULL)')).toStrictEqual([])
  })

  test('should return no buckets for a null definition', () => {
    expect(extractBucketNamesFromDefinition(null)).toStrictEqual([])
  })

  test('should return no buckets for an empty definition', () => {
    expect(extractBucketNamesFromDefinition('')).toStrictEqual([])
  })

  test('should deduplicate repeated bucket names', () => {
    expect(
      extractBucketNamesFromDefinition(
        `((bucket_id = 'avatars'::text) OR (bucket_id = 'avatars'::text))`
      )
    ).toStrictEqual(['avatars'])
  })
})

describe('Storage.utils: getPolicyBucketNames', () => {
  test('should union bucket names from the definition and check clauses', () => {
    expect(
      getPolicyBucketNames({
        definition: `(bucket_id = 'avatars'::text)`,
        check: `(bucket_id = 'logos'::text)`,
      })
    ).toStrictEqual(['avatars', 'logos'])
  })

  test('should find a bucket in the check clause when the definition has no bucket condition', () => {
    expect(
      getPolicyBucketNames({
        definition: `((select auth.uid()::text) = owner)`,
        check: `(bucket_id = 'avatars'::text)`,
      })
    ).toStrictEqual(['avatars'])
  })

  test('should deduplicate buckets referenced in both clauses', () => {
    expect(
      getPolicyBucketNames({
        definition: `(bucket_id = 'avatars'::text)`,
        check: `(bucket_id = 'avatars'::text)`,
      })
    ).toStrictEqual(['avatars'])
  })

  test('should return no buckets when neither clause references bucket_id', () => {
    expect(
      getPolicyBucketNames({ definition: '(auth.uid() IS NOT NULL)', check: null })
    ).toStrictEqual([])
  })
})

describe('Storage.utils: formatPoliciesForStorage', () => {
  test('should group a policy under a bucket referenced only in its check clause', () => {
    const policies = [
      mockPolicy({
        id: 42,
        definition: rawSql(`((select auth.uid()::text) = owner)`),
        check: rawSql(`(bucket_id = 'avatars'::text)`),
      }),
    ]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe('avatars')
    expect(output[0].policies).toHaveLength(1)
    expect(output[0].policies[0].id).toBe(42)
  })

  test('should return an empty array when there are no policies', () => {
    expect(formatPoliciesForStorage([mockBucket('avatars')], [])).toStrictEqual([])
  })

  test('should group a single-bucket policy under its bucket', () => {
    const output = formatPoliciesForStorage([mockBucket('avatars')], [mockPolicy()])

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe('avatars')
    expect(output[0].policies).toHaveLength(1)
  })

  test('should list a multi-bucket policy under every bucket it applies to', () => {
    const policies = [
      mockPolicy({
        definition: rawSql(`(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))`),
      }),
    ]
    const output = formatPoliciesForStorage([mockBucket('avatars'), mockBucket('logos')], policies)

    expect(output.map((group) => group.name)).toStrictEqual(['avatars', 'logos'])
    expect(output[0].policies).toHaveLength(1)
    expect(output[1].policies).toHaveLength(1)
  })

  test('should group a negated policy under the ungrouped section instead of the excluded bucket', () => {
    const policies = [mockPolicy({ definition: rawSql(`(bucket_id <> 'avatars'::text)`) })]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe(UNGROUPED_POLICY_SYMBOL)
  })

  test('should fall back to the check clause when the definition is null', () => {
    const policies = [
      mockPolicy({
        command: 'INSERT',
        definition: null,
        check: rawSql(`(bucket_id = 'avatars'::text)`),
      }),
    ]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe('avatars')
  })

  test('should group policies of buckets that are not loaded under the unknown bucket symbol', () => {
    const policies = [mockPolicy({ definition: rawSql(`(bucket_id = 'not-loaded'::text)`) })]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe(UNKNOWN_BUCKET_SYMBOL)
  })

  test('should list a multi-bucket policy once under the unknown symbol when several buckets are not loaded', () => {
    const policies = [
      mockPolicy({
        definition: rawSql(`(bucket_id = ANY (ARRAY['missing-a'::text, 'missing-b'::text]))`),
      }),
    ]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe(UNKNOWN_BUCKET_SYMBOL)
    expect(output[0].policies).toHaveLength(1)
  })

  test('should group policies without a bucket_id condition under the ungrouped symbol', () => {
    const policies = [mockPolicy({ definition: rawSql('(auth.uid() IS NOT NULL)') })]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe(UNGROUPED_POLICY_SYMBOL)
  })
})
describe('Storage.utils: createPayloadsForAddPolicy', () => {
  test('should create one payload per allowed operation', () => {
    const output = createPayloadsForAddPolicy(
      'avatars',
      mockPolicyFormFields({ allowedOperations: ['SELECT', 'INSERT'] })
    )
    expect(output).toHaveLength(2)
    expect(output.map((payload) => payload.command)).toStrictEqual(['SELECT', 'INSERT'])
  })

  test('should use the check clause for INSERT and the definition for other operations', () => {
    const [select, insert] = createPayloadsForAddPolicy(
      'avatars',
      mockPolicyFormFields({ allowedOperations: ['SELECT', 'INSERT'] })
    )

    expect(select.definition).toBe(`(bucket_id = 'avatars')`)
    expect(select.check).toBeUndefined()
    expect(insert.definition).toBeUndefined()
    expect(insert.check).toBe(`(bucket_id = 'avatars')`)
  })

  test('should target the storage.objects table with a permissive action', () => {
    const [output] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields())
    expect(output.schema).toBe('storage')
    expect(output.table).toBe('objects')
    expect(output.action).toBe('PERMISSIVE')
  })

  test('should omit roles when none are selected', () => {
    const [output] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields({ roles: [] }))
    expect(output.roles).toBeUndefined()
  })

  test('should include the selected roles', () => {
    const [output] = createPayloadsForAddPolicy(
      'avatars',
      mockPolicyFormFields({ roles: ['authenticated'] })
    )
    expect(output.roles).toStrictEqual(['authenticated'])
  })

  test('should collapse consecutive whitespace in the definition', () => {
    const [output] = createPayloadsForAddPolicy(
      'avatars',
      mockPolicyFormFields({ definition: `bucket_id =\n   'avatars'` })
    )
    expect(output.definition).toBe(`(bucket_id = 'avatars')`)
  })

  test('should add a deterministic per-operation suffix to the policy name', () => {
    const [first] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields())
    const [second] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields())
    const [otherBucket] = createPayloadsForAddPolicy('logos', mockPolicyFormFields())

    expect(first.name).toMatch(/^My policy [a-z0-9]+_0$/)
    expect(first.name).toBe(second.name)
    expect(otherBucket.name).not.toBe(first.name)
  })

  test('should keep the policy name as is when the suffix is disabled', () => {
    const [output] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields(), false)
    expect(output.name).toBe('My policy')
  })
})

describe('Storage.utils: createSQLPolicies', () => {
  test('should create one statement per allowed operation', () => {
    const output = createSQLPolicies(
      'avatars',
      mockPolicyFormFields({ allowedOperations: ['SELECT', 'DELETE'] }),
      false
    )
    expect(output).toHaveLength(2)
    expect(output[0].description).toBe(
      'Add policy for the SELECT operation under the policy "My policy"'
    )
    expect(output[0].statement).toBe(
      `CREATE POLICY "My policy" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');`
    )
    expect(output[1].statement).toBe(
      `CREATE POLICY "My policy" ON storage.objects FOR DELETE TO public USING (bucket_id = 'avatars');`
    )
  })

  test('should use WITH CHECK for INSERT statements', () => {
    const [output] = createSQLPolicies(
      'avatars',
      mockPolicyFormFields({ allowedOperations: ['INSERT'] }),
      false
    )
    expect(output.statement).toBe(
      `CREATE POLICY "My policy" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');`
    )
  })

  test('should list the selected roles in the statement', () => {
    const [output] = createSQLPolicies(
      'avatars',
      mockPolicyFormFields({ roles: ['authenticated', 'anon'] }),
      false
    )
    expect(output.statement).toContain('TO authenticated, anon')
  })

  test('should fall back to an empty definition when none is provided', () => {
    const [output] = createSQLPolicies(
      'avatars',
      mockPolicyFormFields({ definition: undefined }),
      false
    )
    expect(output.statement).toContain('USING ();')
  })

  test('should append the same deterministic suffix as the policy payloads', () => {
    const [sql] = createSQLPolicies('avatars', mockPolicyFormFields())
    const [payload] = createPayloadsForAddPolicy('avatars', mockPolicyFormFields())
    expect(sql.statement).toContain(`CREATE POLICY "${payload.name}"`)
  })
})

describe('Storage.utils: applyBucketIdToTemplateDefinition', () => {
  test('should replace the bucket_id placeholder with a quoted bucket id', () => {
    expect(applyBucketIdToTemplateDefinition(`bucket_id = {bucket_id}`, 'avatars')).toBe(
      `bucket_id = 'avatars'`
    )
  })

  test('should leave a definition without a placeholder untouched', () => {
    expect(applyBucketIdToTemplateDefinition(`bucket_id = 'avatars'`, 'logos')).toBe(
      `bucket_id = 'avatars'`
    )
  })
})

describe('Storage.utils: deriveAllowedClientLibraryMethods', () => {
  test('should only allow getPublicUrl when no operations are selected', () => {
    expect(deriveAllowedClientLibraryMethods([])).toStrictEqual(['getPublicUrl'])
  })

  test('should allow read methods for SELECT', () => {
    expect(deriveAllowedClientLibraryMethods(['SELECT'] as never[])).toStrictEqual([
      'download',
      'list',
      'createSignedUrl',
      'createSignedUrls',
      'getPublicUrl',
    ])
  })

  test('should allow upload for INSERT', () => {
    expect(deriveAllowedClientLibraryMethods(['INSERT'] as never[])).toStrictEqual([
      'upload',
      'getPublicUrl',
    ])
  })

  test('should allow methods requiring multiple operations only when all are selected', () => {
    const output = deriveAllowedClientLibraryMethods(['SELECT', 'UPDATE'] as never[])
    expect(output).toContain('update')
    expect(output).toContain('move')
    expect(output).not.toContain('copy')
    expect(output).not.toContain('remove')
  })

  test('should allow every method when all operations are selected', () => {
    expect(
      deriveAllowedClientLibraryMethods(['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as never[])
    ).toStrictEqual([
      'upload',
      'download',
      'list',
      'update',
      'move',
      'copy',
      'remove',
      'createSignedUrl',
      'createSignedUrls',
      'getPublicUrl',
    ])
  })
})
