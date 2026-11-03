import { describe, expect, it } from 'vitest'

import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import {
  extractBucketNamesFromDefinition,
  formatPoliciesForStorage,
  getPolicyBucketNames,
  UNGROUPED_POLICY_SYMBOL,
  UNKNOWN_BUCKET_SYMBOL,
} from '@/components/interfaces/Storage/Storage.utils'
import type { Bucket } from '@/data/storage/buckets-query'

const makePolicy = (
  name: string,
  { definition = null, check = null }: { definition?: string | null; check?: string | null }
) => ({ name, definition, check }) as unknown as Policy

const makeBucket = (name: string) => ({ id: name, name }) as unknown as Bucket

describe('extractBucketNamesFromDefinition', () => {
  it.each([
    ["(bucket_id = 'avatars'::text)", ['avatars']],
    ["((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text))", ['avatars']],
    ["(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))", ['avatars', 'logos']],
    ["((bucket_id = 'a'::text) OR (bucket_id = 'b'::text))", ['a', 'b']],
    ["(bucket_id = 'bob''s files'::text)", ["bob's files"]],
    ["(auth.role() = 'authenticated'::text)", []],
    [null, []],
  ])('extracts buckets from %s', (definition, expected) => {
    expect(extractBucketNamesFromDefinition(definition)).toEqual(expected)
  })

  it.each([
    "(bucket_id <> 'avatars'::text)",
    "(bucket_id != 'avatars'::text)",
    "(bucket_id <> ALL (ARRAY['avatars'::text, 'logos'::text]))",
    "(NOT (bucket_id = 'avatars'::text))",
    "(NOT (bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text])))",
    "((bucket_id = 'logos'::text) OR (bucket_id <> 'avatars'::text))",
  ])('returns no buckets for negated condition %s', (definition) => {
    expect(extractBucketNamesFromDefinition(definition)).toEqual([])
  })
})

describe('getPolicyBucketNames', () => {
  it('reads buckets from check when definition has none', () => {
    const policy = makePolicy('p', {
      definition: "(auth.role() = 'authenticated'::text)",
      check: "(bucket_id = 'avatars'::text)",
    })
    expect(getPolicyBucketNames(policy)).toEqual(['avatars'])
  })

  it('merges buckets from definition and check without duplicates', () => {
    const policy = makePolicy('p', {
      definition: "(bucket_id = 'a'::text)",
      check: "(bucket_id = ANY (ARRAY['a'::text, 'b'::text]))",
    })
    expect(getPolicyBucketNames(policy)).toEqual(['a', 'b'])
  })
})

describe('formatPoliciesForStorage', () => {
  const buckets = [makeBucket('avatars'), makeBucket('logos')]

  const groupNamesFor = (policies: Policy[]) =>
    Object.fromEntries(
      formatPoliciesForStorage(buckets, policies).map((group) => [
        group.name,
        group.policies.map((policy) => policy.name),
      ])
    )

  it('lists a multi-bucket policy under every bucket it covers', () => {
    const multi = makePolicy('multi', {
      definition: "(bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text]))",
    })
    expect(groupNamesFor([multi])).toEqual({ avatars: ['multi'], logos: ['multi'] })
  })

  it('lists a negated policy as ungrouped rather than under the excluded bucket', () => {
    const negated = makePolicy('negated', { definition: "(bucket_id <> 'avatars'::text)" })
    const result = formatPoliciesForStorage(buckets, [negated])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe(UNGROUPED_POLICY_SYMBOL)
  })

  it('maps buckets that are not loaded to the unknown group, once', () => {
    const policy = makePolicy('p', {
      definition: "(bucket_id = ANY (ARRAY['x'::text, 'y'::text, 'logos'::text]))",
    })
    const result = formatPoliciesForStorage(buckets, [policy])
    expect(result.map((group) => group.name)).toEqual([UNKNOWN_BUCKET_SYMBOL, 'logos'])
  })

  it('groups check-only policies under their bucket', () => {
    const insert = makePolicy('insert', { check: "(bucket_id = 'logos'::text)" })
    expect(groupNamesFor([insert])).toEqual({ logos: ['insert'] })
  })
})
