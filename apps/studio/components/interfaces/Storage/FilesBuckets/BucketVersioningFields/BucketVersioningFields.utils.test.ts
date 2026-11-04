import { describe, expect, it } from 'vitest'

import { getRetentionTightening, toNullableNumber } from './BucketVersioningFields.utils'

const params = (overrides: Partial<Parameters<typeof getRetentionTightening>[0]> = {}) => ({
  initialVersioningState: 'enabled' as const,
  isVersioningEnabled: true,
  initialRetentionDays: 30,
  initialMaxVersions: 10,
  nextRetentionDays: 30,
  nextMaxVersions: 10,
  ...overrides,
})

describe('getRetentionTightening', () => {
  it.each([
    { scenario: 'nothing changed', overrides: {}, expected: 'none' },
    {
      scenario: 'a shorter retention window',
      overrides: { nextRetentionDays: 7 },
      expected: 'days',
    },
    { scenario: 'a lower version cap', overrides: { nextMaxVersions: 3 }, expected: 'versions' },
    {
      scenario: 'both bounds tightening at once',
      overrides: { nextRetentionDays: 7, nextMaxVersions: 3 },
      expected: 'both',
    },
    {
      scenario: 'a bound is raised',
      overrides: { nextRetentionDays: 90, nextMaxVersions: 20 },
      expected: 'none',
    },
    {
      scenario: 'a bound is cleared, which retains more rather than less',
      overrides: { nextRetentionDays: null, nextMaxVersions: null },
      expected: 'none',
    },
    {
      scenario: 'a bound is newly added where none existed, which was keeping them forever',
      overrides: { initialRetentionDays: null, nextRetentionDays: 7 },
      expected: 'days',
    },
    {
      scenario: 'a cap is newly added where none existed',
      overrides: { initialMaxVersions: null, nextMaxVersions: 3 },
      expected: 'versions',
    },
    {
      scenario: 'both bounds stay unbounded',
      overrides: {
        initialRetentionDays: null,
        initialMaxVersions: null,
        nextRetentionDays: null,
        nextMaxVersions: null,
      },
      expected: 'none',
    },
    {
      scenario: 'the initial bounds are still loading',
      overrides: { initialRetentionDays: undefined, initialMaxVersions: undefined },
      expected: 'none',
    },
    {
      // Suspending never expires what is already retained, so there is nothing to lose.
      scenario: 'versioning is being turned off',
      overrides: { isVersioningEnabled: false, nextRetentionDays: 7 },
      expected: 'none',
    },
    {
      scenario: 'versioning is being enabled for the first time',
      overrides: {
        initialVersioningState: 'disabled' as const,
        initialRetentionDays: null,
        initialMaxVersions: null,
        nextRetentionDays: 7,
      },
      expected: 'none',
    },
    {
      // A suspended bucket's stored bounds are cleared, so there is nothing to tighten from.
      scenario: 're-enabling a suspended bucket',
      overrides: { initialVersioningState: 'suspended' as const, nextRetentionDays: 7 },
      expected: 'none',
    },
  ])('reports $expected when $scenario', ({ overrides, expected }) => {
    expect(getRetentionTightening(params(overrides))).toBe(expected)
  })
})

describe('toNullableNumber', () => {
  it.each([
    { input: '' as const, expected: null },
    // Zero is a real value, not empty
    { input: 0, expected: 0 },
    { input: 30, expected: 30 },
  ])('maps $input to $expected', ({ input, expected }) => {
    expect(toNullableNumber(input)).toBe(expected)
  })
})
