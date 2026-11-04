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
  {
    definition = null,
    check = null,
    command = 'ALL',
  }: { definition?: string | null; check?: string | null; command?: Policy['command'] }
) => ({ name, definition, check, command }) as unknown as Policy

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

describe('extractBucketNamesFromDefinition with unrestricted branches', () => {
  it.each([
    "((bucket_id = 'a'::text) OR (auth.uid() IS NOT NULL))",
    "(bucket_id = 'a'::text OR auth.uid() IS NOT NULL)",
    "((bucket_id = 'a'::text) OR true)",
  ])('returns no buckets when an OR branch is not bucket-limited: %s', (definition) => {
    expect(extractBucketNamesFromDefinition(definition)).toEqual([])
  })

  it('still extracts buckets when an unrestricted condition is ANDed in', () => {
    expect(
      extractBucketNamesFromDefinition(
        "((bucket_id = 'a'::text) AND ((auth.uid() IS NOT NULL) OR (owner = 'x'::text)))"
      )
    ).toEqual(['a'])
  })

  it('does not split on OR/AND inside string literals', () => {
    expect(extractBucketNamesFromDefinition("(bucket_id = 'this OR that'::text)")).toEqual([
      'this OR that',
    ])
  })
})

describe('getPolicyBucketNames', () => {
  it('returns no buckets when definition has an unrestricted OR branch but check names a bucket', () => {
    const policy = makePolicy('p', {
      definition: "((bucket_id = 'a'::text) OR (auth.uid() IS NOT NULL))",
      check: "(bucket_id = 'a'::text)",
    })
    expect(getPolicyBucketNames(policy)).toEqual([])
  })

  it('returns no buckets when only one of definition and check is negated', () => {
    const policy = makePolicy('p', {
      definition: "(bucket_id <> 'a'::text)",
      check: "(bucket_id = 'a'::text)",
    })
    expect(getPolicyBucketNames(policy)).toEqual([])
  })

  it('reads buckets from check for INSERT policies, which have no using expression', () => {
    const policy = makePolicy('p', { check: "(bucket_id = 'avatars'::text)", command: 'INSERT' })
    expect(getPolicyBucketNames(policy)).toEqual(['avatars'])
  })

  it('reads buckets from using for SELECT policies', () => {
    const policy = makePolicy('p', {
      definition: "(bucket_id = 'avatars'::text)",
      command: 'SELECT',
    })
    expect(getPolicyBucketNames(policy)).toEqual(['avatars'])
  })

  it('returns no buckets when using is not bucket-limited but check names a bucket', () => {
    const policy = makePolicy('p', {
      definition: "(auth.role() = 'authenticated'::text)",
      check: "(bucket_id = 'avatars'::text)",
      command: 'ALL',
    })
    expect(getPolicyBucketNames(policy)).toEqual([])
  })

  it('falls back to using for UPDATE policies without a check', () => {
    const policy = makePolicy('p', {
      definition: "(bucket_id = 'avatars'::text)",
      command: 'UPDATE',
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
    const insert = makePolicy('insert', {
      check: "(bucket_id = 'logos'::text)",
      command: 'INSERT',
    })
    expect(groupNamesFor([insert])).toEqual({ logos: ['insert'] })
  })
})
