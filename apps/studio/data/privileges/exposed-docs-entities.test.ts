import { describe, expect, it } from 'vitest'

import { partitionExposedDocsEntities, type ExposedEntityStatus } from './exposed-docs-entities'

type SpecEntity = { name: string }
type StatusItem = { name: string; status: ExposedEntityStatus }

const spec = (...names: string[]): SpecEntity[] => names.map((name) => ({ name }))
const status = (name: string, status: ExposedEntityStatus): StatusItem => ({ name, status })

describe('partitionExposedDocsEntities', () => {
  it('fails open when statuses are undefined (not yet loaded)', () => {
    const specEntities = spec('todos', 'profiles')
    const result = partitionExposedDocsEntities(specEntities, undefined)
    expect(result.visibleEntities).toEqual(specEntities)
    expect(result.excludedCount).toBe(0)
  })

  it('keeps all entities when every entity is fully granted', () => {
    const result = partitionExposedDocsEntities(spec('todos', 'profiles'), [
      status('todos', 'granted'),
      status('profiles', 'granted'),
    ])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['todos', 'profiles'])
    expect(result.excludedCount).toBe(0)
  })

  it('hides and counts revoked entities', () => {
    const result = partitionExposedDocsEntities(spec('todos', 'secret'), [
      status('todos', 'granted'),
      status('secret', 'revoked'),
    ])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['todos'])
    expect(result.excludedCount).toBe(1)
  })

  it('treats custom (partial) grants as exposed', () => {
    const result = partitionExposedDocsEntities(spec('partial'), [status('partial', 'custom')])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['partial'])
    expect(result.excludedCount).toBe(0)
  })

  it('keeps an entity when a same-named entity in another schema is accessible', () => {
    // e.g. public.foo (granted) vs private.foo (revoked) — both surface as `foo`
    const result = partitionExposedDocsEntities(spec('foo'), [
      status('foo', 'revoked'),
      status('foo', 'granted'),
    ])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['foo'])
    expect(result.excludedCount).toBe(0)
  })

  it('fails open per-entity when a spec entity has no matching status', () => {
    const result = partitionExposedDocsEntities(spec('unknown'), [status('other', 'revoked')])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['unknown'])
    expect(result.excludedCount).toBe(0)
  })

  it('only counts revoked entities that appear in the spec', () => {
    const result = partitionExposedDocsEntities(spec('todos'), [
      status('todos', 'granted'),
      status('revoked_not_in_spec', 'revoked'),
    ])
    expect(result.visibleEntities.map((e) => e.name)).toEqual(['todos'])
    expect(result.excludedCount).toBe(0)
  })

  it('handles an empty spec list', () => {
    const result = partitionExposedDocsEntities([], [status('todos', 'revoked')])
    expect(result.visibleEntities).toEqual([])
    expect(result.excludedCount).toBe(0)
  })
})
