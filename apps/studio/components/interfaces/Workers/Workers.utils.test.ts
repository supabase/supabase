import { describe, expect, it } from 'vitest'

import type { Worker } from './Workers.types'
import { filterWorkers, getPage } from './Workers.utils'

const worker = (overrides: Partial<Worker> & Pick<Worker, 'name'>): Worker => ({
  id: overrides.name,
  runtime: 'node',
  size: '2x1',
  access: 'public',
  instances: 1,
  region: 'us-west-1',
  state: 'active',
  createdAt: '2026-08-10T09:00:00.000Z',
  updatedAt: '2026-08-10T09:00:00.000Z',
  events: [],
  ...overrides,
})

const NO_FILTERS = { search: '', state: 'all', access: 'all' } as const

describe('filterWorkers', () => {
  const workers = [
    worker({ name: 'embed', state: 'active', access: 'public' }),
    worker({ name: 'resize-images', state: 'suspended', access: 'private' }),
    worker({ name: 'embed-batch', state: 'errored', access: 'public' }),
  ]

  it('returns every worker when no filters are set', () => {
    expect(filterWorkers(workers, NO_FILTERS)).toHaveLength(3)
  })

  it('matches names case-insensitively on a partial term', () => {
    const names = filterWorkers(workers, { ...NO_FILTERS, search: 'EMBED' }).map((w) => w.name)
    expect(names).toEqual(['embed', 'embed-batch'])
  })

  it('ignores surrounding whitespace in the search term', () => {
    expect(filterWorkers(workers, { ...NO_FILTERS, search: '  resize  ' })).toHaveLength(1)
  })

  it('filters by state and by access', () => {
    expect(filterWorkers(workers, { ...NO_FILTERS, state: 'errored' }).map((w) => w.name)).toEqual([
      'embed-batch',
    ])
    expect(filterWorkers(workers, { ...NO_FILTERS, access: 'private' }).map((w) => w.name)).toEqual(
      ['resize-images']
    )
  })

  it('combines filters', () => {
    expect(filterWorkers(workers, { search: 'embed', state: 'active', access: 'public' })).toEqual([
      workers[0],
    ])
  })
})

describe('getPage', () => {
  const items = Array.from({ length: 25 }, (_, index) => index)

  it('returns the first window and the total page count', () => {
    const page = getPage(items, 1, 10)
    expect(page.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(page).toMatchObject({ currentPage: 1, totalPages: 3, startIndex: 0 })
  })

  it('returns the remainder on the last page', () => {
    expect(getPage(items, 3, 10).items).toEqual([20, 21, 22, 23, 24])
  })

  it('clamps a page beyond the end so filtering never strands an empty page', () => {
    const page = getPage(items.slice(0, 5), 3, 10)
    expect(page.currentPage).toBe(1)
    expect(page.items).toHaveLength(5)
  })

  it('reports a single page when there are no items', () => {
    expect(getPage([], 1, 10)).toEqual({
      items: [],
      currentPage: 1,
      totalPages: 1,
      startIndex: 0,
    })
  })
})
