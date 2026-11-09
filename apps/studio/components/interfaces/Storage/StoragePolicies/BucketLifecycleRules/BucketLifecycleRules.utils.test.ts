import { describe, expect, test } from 'vitest'

import {
  buildLifecycleRequestPreview,
  canWriteRules,
  describeRule,
  fromRuleValues,
  getOtherRuleIds,
  removeRule,
  setRuleStatus,
  toRuleInput,
  toRuleValues,
  upsertRule,
} from './BucketLifecycleRules.utils'
import type { BucketLifecycleRule } from '@/data/storage/bucket-lifecycle-query'

const ageRule: BucketLifecycleRule = {
  id: 'age',
  status: 'Enabled',
  filter: {},
  noncurrent_version_expiration: { noncurrent_days: 30 },
}

const countRule: BucketLifecycleRule = {
  id: 'count',
  status: 'Disabled',
  filter: {},
  noncurrent_version_expiration: { noncurrent_days: 1, newer_noncurrent_versions: 5 },
}

// A newer Storage version may return actions the request body can't express.
const unknownActionRule: BucketLifecycleRule = { id: 'other', status: 'Enabled', filter: {} }

describe('toRuleInput', () => {
  test('keeps every field the request body accepts', () => {
    expect(toRuleInput(countRule)).toEqual(countRule)
  })

  test('omits a missing ID instead of sending an empty one', () => {
    const { id: _, ...withoutId } = ageRule
    expect(toRuleInput(withoutId)).not.toHaveProperty('id')
  })

  test('rejects rules it cannot send back', () => {
    expect(toRuleInput(unknownActionRule)).toBeNull()
    expect(toRuleInput({ ...ageRule, status: 'Paused' })).toBeNull()
  })
})

describe('canWriteRules', () => {
  test('allows an empty or fully modeled configuration', () => {
    expect(canWriteRules([])).toBe(true)
    expect(canWriteRules([ageRule, countRule])).toBe(true)
  })

  test('blocks writes that would drop an unsupported rule', () => {
    expect(canWriteRules([ageRule, unknownActionRule])).toBe(false)
  })
})

describe('fromRuleValues', () => {
  test('trims the ID and omits it when blank', () => {
    const values = {
      status: 'Enabled' as const,
      noncurrentDays: 7,
      newerNoncurrentVersions: null,
    }
    expect(fromRuleValues({ ...values, id: '  keep-week  ' }).id).toBe('keep-week')
    expect(fromRuleValues({ ...values, id: '   ' })).not.toHaveProperty('id')
  })

  test('only sends newer_noncurrent_versions when set', () => {
    const rule = fromRuleValues({
      id: '',
      status: 'Disabled',
      noncurrentDays: 7,
      newerNoncurrentVersions: 3,
    })
    expect(rule).toEqual({
      status: 'Disabled',
      filter: {},
      noncurrent_version_expiration: { noncurrent_days: 7, newer_noncurrent_versions: 3 },
    })
  })
})

describe('upsertRule', () => {
  const values = {
    id: 'new',
    status: 'Enabled' as const,
    noncurrentDays: 14,
    newerNoncurrentVersions: null,
  }

  test('appends a new rule after the existing ones', () => {
    const rules = upsertRule([ageRule, countRule], null, values)
    expect(rules.map((rule) => rule.id)).toEqual(['age', 'count', 'new'])
  })

  test('replaces the edited rule in place and re-sends the rest unchanged', () => {
    const rules = upsertRule([ageRule, countRule], 0, values)
    expect(rules).toEqual([fromRuleValues(values), countRule])
  })
})

describe('removeRule', () => {
  test('removes only the rule at the index', () => {
    expect(removeRule([ageRule, countRule], 0)).toEqual([countRule])
  })

  test('returns an empty list for the last rule, which deletes the configuration', () => {
    expect(removeRule([ageRule], 0)).toEqual([])
  })
})

describe('setRuleStatus', () => {
  test('flips only the targeted rule', () => {
    const rules = setRuleStatus([ageRule, countRule], 1, 'Enabled')
    expect(rules.map((rule) => rule.status)).toEqual(['Enabled', 'Enabled'])
  })
})

describe('toRuleValues', () => {
  test('seeds a new rule with the project defaults', () => {
    expect(toRuleValues()).toEqual({
      id: '',
      status: 'Enabled',
      noncurrentDays: 30,
      newerNoncurrentVersions: null,
    })
  })

  test('reads an existing rule', () => {
    expect(toRuleValues(countRule)).toEqual({
      id: 'count',
      status: 'Disabled',
      noncurrentDays: 1,
      newerNoncurrentVersions: 5,
    })
  })
})

describe('getOtherRuleIds', () => {
  test('excludes the rule being edited', () => {
    expect(getOtherRuleIds([ageRule, countRule], 0)).toEqual(['count'])
    expect(getOtherRuleIds([ageRule, countRule], null)).toEqual(['age', 'count'])
  })
})

describe('describeRule', () => {
  test('summarizes age and count conditions', () => {
    expect(describeRule(ageRule)).toBe('Expire noncurrent versions after 30 days')
    expect(describeRule(countRule)).toBe(
      'Expire noncurrent versions after 1 day, keeping the newest 5'
    )
    expect(describeRule(unknownActionRule)).toBe('Unsupported action')
  })
})

describe('buildLifecycleRequestPreview', () => {
  test('shows a PUT with a pretty-printed body', () => {
    const preview = buildLifecycleRequestPreview({
      projectRef: 'ref',
      bucketId: 'b',
      rules: [ageRule],
    })
    expect(preview.method).toBe('PUT')
    expect(preview.path).toBe('/platform/storage/ref/buckets/b/lifecycle')
    expect(preview.body).toContain('"noncurrent_days": 30')
  })

  test('shows a DELETE with no body for an empty rule list', () => {
    const preview = buildLifecycleRequestPreview({ projectRef: 'ref', bucketId: 'b', rules: [] })
    expect(preview).toEqual({ method: 'DELETE', path: '/platform/storage/ref/buckets/b/lifecycle' })
  })
})
