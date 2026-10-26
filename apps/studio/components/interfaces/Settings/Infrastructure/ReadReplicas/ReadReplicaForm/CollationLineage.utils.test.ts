import { describe, expect, it } from 'vitest'

import { crossesCollationLineageBoundary, predatesCollationLineage } from './CollationLineage.utils'

const v = (version: string) => `supabase-postgres-${version}`

describe('predatesCollationLineage', () => {
  it('splits each engine at its lineage boundary', () => {
    expect(predatesCollationLineage(v('15.14.1.071'))).toBe(true)
    expect(predatesCollationLineage(v('15.14.1.072'))).toBe(false)
    expect(predatesCollationLineage(v('17.6.1.071'))).toBe(true)
    expect(predatesCollationLineage(v('17.6.1.072'))).toBe(false)
    expect(predatesCollationLineage(v('17.6.0.028-orioledb'))).toBe(true)
    expect(predatesCollationLineage(v('17.6.0.029-orioledb'))).toBe(false)
  })

  it('orders on the full build tuple, not the minor alone', () => {
    expect(predatesCollationLineage(v('17.6.1.063'))).toBe(true)
    expect(predatesCollationLineage(v('17.6.1.084'))).toBe(false)
    expect(predatesCollationLineage(v('15.8.1.100'))).toBe(true)
    expect(predatesCollationLineage(v('17.11.0.001'))).toBe(false)
    expect(predatesCollationLineage(v('15.19.0.001'))).toBe(false)
    expect(predatesCollationLineage(v('17.11.0.002-orioledb'))).toBe(false)
  })

  it('treats PG14 as pre-lineage and PG18+ as post-lineage', () => {
    expect(predatesCollationLineage(v('14.5.1.001'))).toBe(true)
    expect(predatesCollationLineage(v('18.1.1.001'))).toBe(false)
  })

  it('returns null for absent or unparseable versions', () => {
    expect(predatesCollationLineage(undefined)).toBeNull()
    expect(predatesCollationLineage('garbage')).toBeNull()
  })
})

describe('crossesCollationLineageBoundary', () => {
  const cross = (sourceVersion: string | undefined, targetVersions: string[]) =>
    crossesCollationLineageBoundary({ sourceVersion, targetVersions })

  it('is true for a pre-lineage source onto any current build', () => {
    expect(cross(v('17.6.1.063'), [v('17.6.1.178')])).toBe(true)
    expect(cross(v('15.14.1.071'), [v('15.19.0.001')])).toBe(true)
    expect(cross(v('17.6.0.028-orioledb'), [v('17.11.0.002-orioledb')])).toBe(true)
  })

  it('is true across engines when the source predates the lineage', () => {
    expect(cross(v('15.14.1.071'), [v('17.11.0.001')])).toBe(true)
  })

  it('is false when the source is already on the lineage', () => {
    expect(cross(v('17.6.1.084'), [v('17.11.0.001')])).toBe(false)
    expect(cross(v('15.14.1.086'), [v('17.11.0.001')])).toBe(false)
    expect(cross(v('17.6.0.029-orioledb'), [v('17.11.0.002-orioledb')])).toBe(false)
  })

  it('treats an absent or unparseable source as pre-lineage', () => {
    expect(cross(undefined, [v('17.11.0.001')])).toBe(true)
    expect(cross('garbage', [v('17.11.0.001')])).toBe(true)
  })

  it('is false without a post-lineage target', () => {
    expect(cross(v('17.6.1.063'), [])).toBe(false)
    expect(cross(v('17.6.1.063'), [v('17.6.1.071')])).toBe(false)
    expect(cross(v('17.6.1.063'), ['garbage'])).toBe(false)
  })
})
