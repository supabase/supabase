import { describe, expect, it } from 'vitest'

import { filterSchemasForHighAvailability } from '../useHighAvailability'
import { MULTIGRES_SCHEMA_NAME, resolveHighAvailability } from '../useHighAvailability.constants'

describe('filterSchemasForHighAvailability', () => {
  const schemas = [{ name: 'public' }, { name: MULTIGRES_SCHEMA_NAME }, { name: 'other' }]

  it('removes the multigres schema on high availability projects', () => {
    expect(filterSchemasForHighAvailability(schemas, true)).toEqual([
      { name: 'public' },
      { name: 'other' },
    ])
  })

  it('keeps all schemas on non high availability projects', () => {
    expect(filterSchemasForHighAvailability(schemas, false)).toEqual(schemas)
  })
})

describe('resolveHighAvailability', () => {
  it('returns the project flag when set', () => {
    expect(resolveHighAvailability({ high_availability: true })).toBe(true)
    expect(resolveHighAvailability({ high_availability: false })).toBe(false)
  })

  it('defaults to false when the project or flag is missing', () => {
    expect(resolveHighAvailability(undefined)).toBe(false)
    expect(resolveHighAvailability({ high_availability: null })).toBe(false)
    expect(resolveHighAvailability({})).toBe(false)
  })
})
