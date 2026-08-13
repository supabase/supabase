import { describe, expect, it } from 'vitest'

import { getCatalogEntry } from '../../AccessToken.permissions'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import {
  computeRiskBanner,
  getCapabilityDensityTier,
  getNotGrantedCatalogEntries,
  getSharedPathPrefix,
  groupCapabilitiesByLevel,
  splitEndpointPath,
} from './TokenCapabilities.utils'

// 'project:database' is catalog-high and writable; 'project:advisors' is catalog-low and read-only.
const databaseCapability = (
  mode: CapabilitySummaryEntry['mode'],
  endpoints: CapabilitySummaryEntry['endpoints'] = []
): CapabilitySummaryEntry => ({
  entry: getCatalogEntry('project:database')!,
  mode,
  endpoints,
  mcpTools: [],
})

const advisorsCapability = (mode: CapabilitySummaryEntry['mode']): CapabilitySummaryEntry => ({
  entry: getCatalogEntry('project:advisors')!,
  mode,
  endpoints: [],
  mcpTools: [],
})

describe('getCapabilityDensityTier', () => {
  it('is accordion at 8 or fewer capabilities', () => {
    expect(getCapabilityDensityTier(0)).toBe('accordion')
    expect(getCapabilityDensityTier(8)).toBe('accordion')
  })

  it('is dense at 9 or more capabilities', () => {
    expect(getCapabilityDensityTier(9)).toBe('dense')
    expect(getCapabilityDensityTier(50)).toBe('dense')
  })
})

describe('getSharedPathPrefix', () => {
  it('returns nothing for a single endpoint — there is nothing to share', () => {
    expect(getSharedPathPrefix(['/v1/projects/{ref}'])).toBe('')
  })

  it('finds the longest shared leading segments across paths', () => {
    expect(
      getSharedPathPrefix(['/v1/projects/{ref}/functions', '/v1/projects/{ref}/functions/{slug}'])
    ).toBe('/v1/projects/{ref}/functions/')
  })

  it('never cuts a shared prefix mid-segment', () => {
    // "functions" and "functions-secrets" share characters but not a path segment.
    expect(
      getSharedPathPrefix(['/v1/projects/{ref}/functions', '/v1/projects/{ref}/functions-secrets'])
    ).toBe('/v1/projects/{ref}/')
  })

  it('shares only the common leading segments, not any further', () => {
    expect(getSharedPathPrefix(['/v1/branches', '/v1/organizations'])).toBe('/v1/')
  })

  it('returns nothing when paths share no leading segment at all', () => {
    expect(getSharedPathPrefix(['/v1/branches', '/v2/organizations'])).toBe('')
  })

  it('keeps at least the last segment distinguishing when every path is identical', () => {
    expect(getSharedPathPrefix(['/v1/projects/{ref}', '/v1/projects/{ref}'])).toBe('/v1/projects/')
  })
})

describe('splitEndpointPath', () => {
  it('splits off the shared prefix when the path starts with it', () => {
    expect(splitEndpointPath('/v1/projects/{ref}/functions', '/v1/projects/{ref}/')).toEqual({
      prefix: '/v1/projects/{ref}/',
      distinguishing: 'functions',
    })
  })

  it('treats the whole path as distinguishing when there is no shared prefix', () => {
    expect(splitEndpointPath('/v1/projects/{ref}', '')).toEqual({
      prefix: '',
      distinguishing: '/v1/projects/{ref}',
    })
  })
})

describe('groupCapabilitiesByLevel', () => {
  it('splits granted capabilities into read-write and read-only', () => {
    const capabilities = [databaseCapability('readwrite'), advisorsCapability('read')]

    const { readwrite, read } = groupCapabilitiesByLevel(capabilities)
    expect(readwrite.map((c) => c.entry.key)).toEqual(['project:database'])
    expect(read.map((c) => c.entry.key)).toEqual(['project:advisors'])
  })
})

describe('getNotGrantedCatalogEntries', () => {
  it('returns every catalog entry when nothing is granted', () => {
    expect(getNotGrantedCatalogEntries([]).map((e) => e.key)).toContain('project:database')
  })

  it('excludes granted entries', () => {
    const notGranted = getNotGrantedCatalogEntries([databaseCapability('read')])
    expect(notGranted.map((e) => e.key)).not.toContain('project:database')
  })
})

describe('computeRiskBanner', () => {
  it('reports Minimal with no active capabilities', () => {
    const risk = computeRiskBanner({
      effectiveSelection: {},
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['proj-1'],
    })
    expect(risk).toEqual({ level: 'Minimal', tone: 'default', summary: 'No capabilities granted.' })
  })

  it('downgrades a read-only grant so it never outranks read-write on a lower-risk resource', () => {
    // project:database is catalog-high; read-only downgrades it to medium.
    const risk = computeRiskBanner({
      effectiveSelection: { 'project:database': 'read' },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['proj-1'],
    })
    expect(risk.level).toBe('Medium')
  })

  it('takes the max risk across capabilities, not just a write flag', () => {
    const risk = computeRiskBanner({
      effectiveSelection: { 'project:database': 'readwrite', 'project:advisors': 'read' },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['proj-1'],
    })
    expect(risk.level).toBe('High')
  })

  it('escalates account-wide read-write access to High', () => {
    const risk = computeRiskBanner({
      effectiveSelection: { 'project:advisors': 'readwrite' },
      resourceAccess: 'account',
      organizationSlugs: [],
      projectRefs: [],
    })
    expect(risk.level).toBe('High')
    expect(risk.summary).toContain('across your entire account')
  })

  it('escalates project scope spanning many bound projects', () => {
    const narrow = computeRiskBanner({
      effectiveSelection: { 'project:advisors': 'read' },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['a'],
    })
    const broad = computeRiskBanner({
      effectiveSelection: { 'project:advisors': 'read' },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['a', 'b', 'c', 'd', 'e', 'f'],
    })
    expect(narrow.level).toBe('Low')
    expect(broad.level).toBe('Medium')
  })

  it('summarizes mixed read and read-write grants with explicit scope breadth', () => {
    const risk = computeRiskBanner({
      effectiveSelection: {
        'project:database': 'readwrite',
        'project:advisors': 'read',
        'project:storage': 'read',
      },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: ['a', 'b', 'c'],
    })
    expect(risk.summary).toBe('Read-write on 1 capability, read on 2, across 3 projects.')
  })

  it('states scope breadth even when nothing is bound', () => {
    const risk = computeRiskBanner({
      effectiveSelection: { 'project:advisors': 'read' },
      resourceAccess: 'project',
      organizationSlugs: [],
      projectRefs: [],
    })
    expect(risk.summary).toContain('with no projects bound')
  })
})
