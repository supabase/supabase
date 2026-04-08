import { describe, expect, it } from 'vitest'

import {
  generateObservabilityMenuItems,
  type ObservabilityMenuSection,
} from './ObservabilityMenu.utils'

const REF = 'test-project-ref'
const QUERY_PARAMS = ''

const sectionTitles = (sections: ObservabilityMenuSection[]) => sections.map((s) => s.title)

const itemKeys = (section: ObservabilityMenuSection | undefined) =>
  section?.items.map((i) => i.key) ?? []

const findSection = (sections: ObservabilityMenuSection[], title: string) =>
  sections.find((s) => s.title === title)

describe('generateObservabilityMenuItems - PRODUCT section', () => {
  it('includes PRODUCT section on platform', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: true,
    })

    expect(sectionTitles(menu)).toContain('PRODUCT')
    const productSection = findSection(menu, 'PRODUCT')
    expect(itemKeys(productSection)).toEqual([
      'database',
      'postgrest',
      'auth',
      'edge-functions',
      'storage',
      'realtime',
    ])
  })

  it('excludes PRODUCT section in self-hosted mode', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    expect(sectionTitles(menu)).not.toContain('PRODUCT')
    expect(menu.length).toBe(1) // Only GENERAL section
  })

  it('excludes Storage from PRODUCT when storageSupported is false', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: false,
      isPlatform: true,
    })

    const productSection = findSection(menu, 'PRODUCT')
    expect(itemKeys(productSection)).not.toContain('storage')
    expect(itemKeys(productSection)).toEqual([
      'database',
      'postgrest',
      'auth',
      'edge-functions',
      'realtime',
    ])
  })

  it('includes Storage in PRODUCT when storageSupported is true', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: true,
    })

    const productSection = findSection(menu, 'PRODUCT')
    expect(itemKeys(productSection)).toContain('storage')
  })
})

describe('generateObservabilityMenuItems - GENERAL section', () => {
  it('always includes GENERAL section', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    expect(sectionTitles(menu)).toContain('GENERAL')
  })

  it('includes Query Performance when supamonitor is disabled', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).toContain('query-performance')
    expect(itemKeys(generalSection)).not.toContain('query-insights')
  })

  it('includes Query Insights when supamonitor is enabled', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: true,
      storageSupported: true,
      isPlatform: false,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).toContain('query-insights')
    expect(itemKeys(generalSection)).not.toContain('query-performance')
  })

  it('includes Overview when showOverview is true', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: true,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).toContain('observability')
  })

  it('excludes Overview when showOverview is false', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).not.toContain('observability')
  })

  it('includes API Gateway on platform', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: true,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).toContain('api-overview')
  })

  it('excludes API Gateway in self-hosted mode', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).not.toContain('api-overview')
  })
})

describe('generateObservabilityMenuItems - URL construction', () => {
  it('constructs correct URLs with preserved query params', () => {
    const params = '?its=2024-01-01&ite=2024-01-31'
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: params,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: true,
    })

    const generalSection = findSection(menu, 'GENERAL')
    const queryPerfItem = generalSection?.items.find((i) => i.key === 'query-performance')
    expect(queryPerfItem?.url).toBe(`/project/${REF}/observability/query-performance${params}`)

    const productSection = findSection(menu, 'PRODUCT')
    const databaseItem = productSection?.items.find((i) => i.key === 'database')
    expect(databaseItem?.url).toBe(`/project/${REF}/observability/database${params}`)
  })

  it('handles undefined ref', () => {
    const menu = generateObservabilityMenuItems({
      ref: undefined,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: false,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: true,
    })

    const generalSection = findSection(menu, 'GENERAL')
    const queryPerfItem = generalSection?.items.find((i) => i.key === 'query-performance')
    expect(queryPerfItem?.url).toBe('/project/undefined/observability/query-performance')
  })
})

describe('generateObservabilityMenuItems - complete structure', () => {
  it('returns only GENERAL in self-hosted with all standard items', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: true,
      isSupamonitorEnabled: false,
      storageSupported: true,
      isPlatform: false,
    })

    expect(menu.length).toBe(1)
    expect(menu[0].title).toBe('GENERAL')
    expect(itemKeys(menu[0])).toEqual([
      'observability', // Overview
      'query-performance',
      // API Gateway excluded
    ])
  })

  it('returns GENERAL and PRODUCT on platform with all items', () => {
    const menu = generateObservabilityMenuItems({
      ref: REF,
      preservedQueryParams: QUERY_PARAMS,
      showOverview: true,
      isSupamonitorEnabled: true,
      storageSupported: true,
      isPlatform: true,
    })

    expect(menu.length).toBe(2)
    expect(sectionTitles(menu)).toEqual(['GENERAL', 'PRODUCT'])

    const generalSection = findSection(menu, 'GENERAL')
    expect(itemKeys(generalSection)).toEqual([
      'observability', // Overview
      'query-insights', // Supamonitor enabled
      'api-overview', // Platform only
    ])

    const productSection = findSection(menu, 'PRODUCT')
    expect(itemKeys(productSection)).toEqual([
      'database',
      'postgrest',
      'auth',
      'edge-functions',
      'storage',
      'realtime',
    ])
  })
})
