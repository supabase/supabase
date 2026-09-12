import { describe, expect, test } from 'vitest'

import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import {
  formatPoliciesForStorage,
  getPolicyBucketNames,
  isPolicyExclusiveToBucket,
  UNGROUPED_POLICY_SYMBOL,
  UNKNOWN_BUCKET_SYMBOL,
} from '@/components/interfaces/Storage/Storage.utils'
import type { Bucket } from '@/data/storage/buckets-query'

/**
 * Storage policies are grouped per bucket by parsing the `bucket_id` conditions out of the
 * policy expression that Postgres hands back. The definitions below are copied from the
 * shape `pg_policies` actually returns (normalized, `::text` casts and all) rather than the
 * SQL a user would type.
 */
const policy = (definition: string | null, check: string | null = null, name = 'policy') =>
  ({ id: 1, name, table: 'objects', schema: 'storage', definition, check }) as unknown as Policy

const bucket = (name: string) => ({ id: name, name }) as unknown as Bucket

describe('getPolicyBucketNames', () => {
  test('reads a single bucket from an equality condition', () => {
    expect(getPolicyBucketNames(policy("(bucket_id = 'avatars'::text)"))).toEqual(['avatars'])
  })

  test('reads every bucket from the ANY(ARRAY[...]) form of `in`', () => {
    expect(
      getPolicyBucketNames(
        policy("(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text, 'docs'::text]))")
      )
    ).toEqual(['avatars', 'logos', 'docs'])
  })

  test('ignores a negated condition, which applies to every other bucket', () => {
    expect(getPolicyBucketNames(policy("(bucket_id <> 'avatars'::text)"))).toEqual([])
    expect(getPolicyBucketNames(policy("(bucket_id != 'avatars'::text)"))).toEqual([])
  })

  test('keeps the positive bucket when a definition both allows and excludes', () => {
    expect(
      getPolicyBucketNames(
        policy("((bucket_id = 'avatars'::text) AND (bucket_id <> 'logos'::text))")
      )
    ).toEqual(['avatars'])
  })

  test('collects buckets across several AND/OR segments', () => {
    expect(
      getPolicyBucketNames(policy("((bucket_id = 'avatars'::text) OR (bucket_id = 'logos'::text))"))
    ).toEqual(['avatars', 'logos'])
  })

  test('unions the USING and WITH CHECK clauses', () => {
    expect(
      getPolicyBucketNames(policy("(bucket_id = 'avatars'::text)", "(bucket_id = 'logos'::text)"))
    ).toEqual(['avatars', 'logos'])
  })

  test('reads the bucket from WITH CHECK when USING is null', () => {
    expect(getPolicyBucketNames(policy(null, "(bucket_id = 'avatars'::text)"))).toEqual(['avatars'])
  })

  test('deduplicates a bucket named more than once', () => {
    expect(
      getPolicyBucketNames(
        policy(
          "((bucket_id = 'avatars'::text) AND (owner = auth.uid()))",
          "(bucket_id = 'avatars'::text)"
        )
      )
    ).toEqual(['avatars'])
  })

  test('returns nothing when the policy names no bucket', () => {
    expect(getPolicyBucketNames(policy('(owner = auth.uid())'))).toEqual([])
    expect(getPolicyBucketNames(policy(null, null))).toEqual([])
    expect(getPolicyBucketNames(policy(''))).toEqual([])
  })

  test('tolerates whitespace variations around the operator', () => {
    expect(getPolicyBucketNames(policy("(bucket_id='avatars'::text)"))).toEqual(['avatars'])
    expect(getPolicyBucketNames(policy("(bucket_id   =   ANY   (  ARRAY  ['a'::text] ))"))).toEqual(
      ['a']
    )
  })

  test('handles a bucket name containing an escaped single quote', () => {
    expect(getPolicyBucketNames(policy("(bucket_id = 'bob''s files'::text)"))).toEqual([
      "bob's files",
    ])
  })

  test('does not mistake another column ending in bucket_id for the bucket column', () => {
    expect(getPolicyBucketNames(policy("(owner = 'avatars'::text)"))).toEqual([])
    // Reachable without touching storage.objects, via a subquery over a user's own table
    expect(
      getPolicyBucketNames(
        policy(
          "(EXISTS ( SELECT 1 FROM zz_archive a WHERE (a.archive_bucket_id = 'avatars'::text)))"
        )
      )
    ).toEqual([])
    expect(
      getPolicyBucketNames(policy("(a.archive_bucket_id = ANY (ARRAY['avatars'::text]))"))
    ).toEqual([])
  })

  test('still reads a table-qualified bucket_id reference', () => {
    expect(getPolicyBucketNames(policy("(objects.bucket_id = 'avatars'::text)"))).toEqual([
      'avatars',
    ])
  })

  test('ignores a NOT-wrapped equality, which Postgres stores verbatim rather than as <>', () => {
    expect(getPolicyBucketNames(policy("(NOT (bucket_id = 'avatars'::text))"))).toEqual([])
    expect(
      getPolicyBucketNames(
        policy("(NOT (bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text])))")
      )
    ).toEqual([])
  })
})

describe('isPolicyExclusiveToBucket', () => {
  test('accepts a policy that only ever applies to the bucket', () => {
    expect(isPolicyExclusiveToBucket(policy("(bucket_id = 'avatars'::text)"), 'avatars')).toBe(true)
    expect(
      isPolicyExclusiveToBucket(
        policy("((bucket_id = 'avatars'::text) AND (owner = auth.uid()))"),
        'avatars'
      )
    ).toBe(true)
  })

  test('rejects an OR branch that still grants access in other buckets', () => {
    expect(
      isPolicyExclusiveToBucket(
        policy("((bucket_id = 'avatars'::text) OR (owner = auth.uid()))"),
        'avatars'
      )
    ).toBe(false)
  })

  test('rejects a negated policy, which guards every other bucket', () => {
    expect(isPolicyExclusiveToBucket(policy("(bucket_id <> 'avatars'::text)"), 'avatars')).toBe(
      false
    )
    expect(
      isPolicyExclusiveToBucket(policy("(NOT (bucket_id = 'avatars'::text))"), 'avatars')
    ).toBe(false)
  })

  test('rejects a policy whose bucket_id may belong to a subquery', () => {
    expect(
      isPolicyExclusiveToBucket(
        policy("(EXISTS ( SELECT 1 FROM other o WHERE (o.bucket_id = 'avatars'::text)))"),
        'avatars'
      )
    ).toBe(false)
  })

  test('rejects a policy shared with another bucket', () => {
    expect(
      isPolicyExclusiveToBucket(
        policy("(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))"),
        'avatars'
      )
    ).toBe(false)
  })

  test('rejects a policy for a different bucket, or for no bucket at all', () => {
    expect(isPolicyExclusiveToBucket(policy("(bucket_id = 'logos'::text)"), 'avatars')).toBe(false)
    expect(isPolicyExclusiveToBucket(policy('(owner = auth.uid())'), 'avatars')).toBe(false)
  })

  test('rejects a policy whose other clause is unrestricted', () => {
    // `using (owner = auth.uid()) with check (bucket_id = 'avatars')` still lets the caller
    // read their own objects in every other bucket, so the bucket does not own it
    expect(
      isPolicyExclusiveToBucket(
        policy('(owner = auth.uid())', "(bucket_id = 'avatars'::text)"),
        'avatars'
      )
    ).toBe(false)
    expect(
      isPolicyExclusiveToBucket(
        policy("(bucket_id = 'avatars'::text)", '(owner = auth.uid())'),
        'avatars'
      )
    ).toBe(false)
  })

  test('accepts a policy whose every clause is confined to the bucket', () => {
    expect(
      isPolicyExclusiveToBucket(
        policy("(bucket_id = 'avatars'::text)", "(bucket_id = 'avatars'::text)"),
        'avatars'
      )
    ).toBe(true)
  })

  test('rejects a policy with no clauses at all', () => {
    expect(isPolicyExclusiveToBucket(policy(null, null), 'avatars')).toBe(false)
  })

  test('checks the WITH CHECK clause too', () => {
    expect(
      isPolicyExclusiveToBucket(
        policy(
          "(bucket_id = 'avatars'::text)",
          "((bucket_id = 'avatars'::text) OR (owner = auth.uid()))"
        ),
        'avatars'
      )
    ).toBe(false)
  })
})

describe('formatPoliciesForStorage', () => {
  test('lists a multi-bucket policy under every bucket it covers', () => {
    const multiBucket = policy(
      "(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))",
      null,
      'Multi bucket read'
    )

    const grouped = formatPoliciesForStorage([bucket('avatars'), bucket('logos')], [multiBucket])

    expect(grouped.find((group) => group.name === 'avatars')?.policies).toEqual([multiBucket])
    expect(grouped.find((group) => group.name === 'logos')?.policies).toEqual([multiBucket])
  })

  test('puts a negated policy under Ungrouped rather than the bucket it excludes', () => {
    const negated = policy("(bucket_id <> 'avatars'::text)", null, 'Not avatars')

    const grouped = formatPoliciesForStorage([bucket('avatars')], [negated])

    expect(grouped.find((group) => group.name === 'avatars')).toBeUndefined()
    expect(grouped.find((group) => group.name === UNGROUPED_POLICY_SYMBOL)?.policies).toEqual([
      negated,
    ])
  })

  test('groups a policy for a bucket that is not loaded under Unknown', () => {
    const unloaded = policy("(bucket_id = 'not-paginated-yet'::text)", null, 'Unloaded')

    const grouped = formatPoliciesForStorage([bucket('avatars')], [unloaded])

    expect(grouped.find((group) => group.name === UNKNOWN_BUCKET_SYMBOL)?.policies).toEqual([
      unloaded,
    ])
  })

  test('splits a policy across a loaded bucket and the Unknown group', () => {
    const mixed = policy(
      "(bucket_id = ANY (ARRAY['avatars'::text, 'not-loaded'::text]))",
      null,
      'Mixed'
    )

    const grouped = formatPoliciesForStorage([bucket('avatars')], [mixed])

    expect(grouped.find((group) => group.name === 'avatars')?.policies).toEqual([mixed])
    expect(grouped.find((group) => group.name === UNKNOWN_BUCKET_SYMBOL)?.policies).toEqual([mixed])
  })

  test('returns nothing when there are no policies', () => {
    expect(formatPoliciesForStorage([bucket('avatars')], [])).toEqual([])
  })
})
