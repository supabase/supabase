import { rawSql } from '@supabase/pg-meta'
import { describe, expect, test } from 'vitest'

import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import {
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
        definition: rawSql(`((select auth.uid()::text) = owner)`),
        check: rawSql(`(bucket_id = 'avatars'::text)`),
      }),
    ]
    const output = formatPoliciesForStorage([mockBucket('avatars')], policies)

    expect(output).toHaveLength(1)
    expect(output[0].name).toBe('avatars')
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
