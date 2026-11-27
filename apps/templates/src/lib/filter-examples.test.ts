import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { countByFeature, filterExamples, usedCategories, usedFeatures } from './filter-examples'
import { EXAMPLES } from '@/data/registry'
import type { Example } from '@/data/types'

const screenshotFile = (slug: string, theme: string) =>
  join(__dirname, '../../public/screenshots', `${slug}-${theme}.jpg`)

function makeExample(overrides: Partial<Example> & Pick<Example, 'slug'>): Example {
  return {
    title: overrides.slug,
    tagline: '',
    description: [],
    category: 'productivity',
    features: ['database'],
    stack: ['React'],
    author: { name: 'Supabase', url: 'https://github.com/supabase' },
    updatedAt: '2026-11-27',
    repoUrl: 'https://github.com/supabase/supabase',
    demoUrl: 'https://example.com',
    deploy: { steps: [], env: [] },
    ...overrides,
  }
}

const FIXTURES: Example[] = [
  makeExample({
    slug: 'board',
    title: 'Board',
    features: ['database', 'realtime'],
    stack: ['React', 'Vite'],
  }),
  makeExample({
    slug: 'photos',
    title: 'Photos',
    category: 'social',
    features: ['storage', 'database'],
    stack: ['Next.js'],
  }),
  makeExample({
    slug: 'monitor',
    title: 'Monitor',
    category: 'developer-tools',
    features: ['cron', 'queues'],
    stack: ['Nuxt'],
  }),
]

describe('filterExamples', () => {
  it('returns everything when no filters are set', () => {
    expect(filterExamples(FIXTURES, { query: '', features: [] })).toHaveLength(3)
  })

  it('requires every selected feature', () => {
    const results = filterExamples(FIXTURES, { query: '', features: ['storage', 'database'] })
    expect(results.map((example) => example.slug)).toEqual(['photos'])
  })

  it('matches every word of the query against title, stack and features', () => {
    expect(
      filterExamples(FIXTURES, { query: 'vite realtime', features: [] }).map((e) => e.slug)
    ).toEqual(['board'])
    expect(filterExamples(FIXTURES, { query: 'next storage', features: [] })).toHaveLength(1)
  })

  it('filters by category', () => {
    const results = filterExamples(FIXTURES, { query: '', features: [], category: 'social' })
    expect(results.map((example) => example.slug)).toEqual(['photos'])
  })

  it('returns nothing for an unmatched query', () => {
    expect(filterExamples(FIXTURES, { query: 'zzzz-no-match', features: [] })).toEqual([])
  })
})

describe('filter options', () => {
  it('counts features', () => {
    const counts = countByFeature(FIXTURES)
    expect(counts.database).toBe(2)
    expect(counts.vectors).toBe(0)
  })

  it('lists only the categories and features in use, in declared order', () => {
    expect(usedCategories(FIXTURES)).toEqual(['social', 'productivity', 'developer-tools'])
    expect(usedFeatures(FIXTURES)).toEqual(['database', 'storage', 'realtime', 'cron', 'queues'])
  })
})

describe('registry', () => {
  it('has unique slugs', () => {
    const slugs = EXAMPLES.map((example) => example.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('has light and dark screenshots for every example', () => {
    for (const example of EXAMPLES) {
      for (const theme of ['light', 'dark'] as const) {
        expect(existsSync(screenshotFile(example.slug, theme))).toBe(true)
      }
    }
  })

  it('points every example at a live demo', () => {
    for (const example of EXAMPLES) {
      expect(example.demoUrl).toMatch(/^https:\/\//)
    }
  })
})
