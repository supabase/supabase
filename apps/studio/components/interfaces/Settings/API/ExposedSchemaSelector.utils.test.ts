import { describe, expect, it } from 'vitest'

import { getExposedSchemaCounts } from './ExposedSchemaSelector.utils'

const PROTECTED = new Set(['storage', 'graphql', 'realtime', '_realtime'])

describe('getExposedSchemaCounts', () => {
  it('counts a normal platform selection (no protected schemas exposed)', () => {
    expect(
      getExposedSchemaCounts({
        visibleSchemas: ['public', 'api', 'analytics'],
        selectedSchemas: ['public'],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 1, totalCount: 3 })
  })

  it('folds a protected-but-exposed schema (self-hosted `storage`) into both sides', () => {
    // `storage` is exposed via PGRST_DB_SCHEMAS but filtered out of the selectable list.
    expect(
      getExposedSchemaCounts({
        visibleSchemas: ['public', 'analytics'],
        selectedSchemas: ['public', 'storage'],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 2, totalCount: 3 })
  })

  it('does not count a protected schema that is not exposed', () => {
    expect(
      getExposedSchemaCounts({
        visibleSchemas: ['public', 'analytics'],
        selectedSchemas: ['public'],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 1, totalCount: 2 })
  })

  it('excludes orphan schemas (exposed but absent from the database and not protected)', () => {
    // `dropped_schema` is in the exposed config but no longer exists; it renders a "does not
    // exist" row but must not inflate either side of the fraction.
    expect(
      getExposedSchemaCounts({
        visibleSchemas: ['public', 'analytics'],
        selectedSchemas: ['public', 'dropped_schema'],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 1, totalCount: 2 })
  })

  it('handles a mix of protected-exposed and orphan schemas', () => {
    expect(
      getExposedSchemaCounts({
        visibleSchemas: ['public', 'analytics'],
        selectedSchemas: ['public', 'storage', 'dropped_schema'],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 2, totalCount: 3 })
  })

  it('returns zero counts when there are no schemas', () => {
    expect(
      getExposedSchemaCounts({
        visibleSchemas: [],
        selectedSchemas: [],
        protectedSchemas: PROTECTED,
      })
    ).toEqual({ selectedCount: 0, totalCount: 0 })
  })
})
