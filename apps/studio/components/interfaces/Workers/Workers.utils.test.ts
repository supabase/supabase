import { describe, expect, it } from 'vitest'

import type { Worker } from './Workers.types'
import {
  filterWorkers,
  formatResources,
  formatRuntime,
  formatSize,
  getPage,
  isWorkersAccessDenied,
} from './Workers.utils'
import { ResponseError } from '@/types'

const worker = (overrides: Partial<Worker> & Pick<Worker, 'name'>): Worker => ({
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 1,
  ...overrides,
})

const NO_FILTERS = { search: '', state: 'all', access: 'all' } as const

describe('filterWorkers', () => {
  const workers = [
    worker({ name: 'embed', buildState: 'active', access: 'public' }),
    worker({ name: 'resize-images', buildState: 'building', access: 'private' }),
    worker({ name: 'embed-batch', buildState: 'failed', access: 'public' }),
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

  it('filters by build state and by access', () => {
    expect(filterWorkers(workers, { ...NO_FILTERS, state: 'failed' }).map((w) => w.name)).toEqual([
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

describe('formatSize', () => {
  it('splits the memory and vCPU parts the API reports', () => {
    expect(formatSize('2gb-1vcpu')).toBe('2 GB · 1 vCPU')
    expect(formatSize('4gb-2vcpu')).toBe('4 GB · 2 vCPU')
  })

  it('falls back to the raw value for a shape it does not recognize', () => {
    expect(formatSize('8gb-4vcpu-gpu')).toBe('8gb-4vcpu-gpu')
    expect(formatSize('')).toBe('')
  })
})

describe('formatRuntime', () => {
  it('labels a known runtime', () => {
    expect(formatRuntime('python')).toBe('Python 3.14')
  })

  it('shows the raw value for a runtime it does not know', () => {
    expect(formatRuntime('rust')).toBe('rust')
  })

  it('reports unknown when the API omits the runtime', () => {
    expect(formatRuntime(undefined)).toBe('Unknown')
  })
})

describe('formatResources', () => {
  it('combines size and declared instance count', () => {
    expect(formatResources(worker({ name: 'embed', declaredInstances: 3 }))).toBe(
      '2 GB · 1 vCPU · 3 inst'
    )
  })
})

describe('isWorkersAccessDenied', () => {
  const responseError = (code?: number) => new ResponseError('Denied', code)

  it('treats forbidden and not-found as the project missing from the alpha allowlist', () => {
    expect(isWorkersAccessDenied(responseError(403))).toBe(true)
    expect(isWorkersAccessDenied(responseError(404))).toBe(true)
  })

  it('leaves other failures to the generic error UI', () => {
    expect(isWorkersAccessDenied(responseError(500))).toBe(false)
    expect(isWorkersAccessDenied(responseError(undefined))).toBe(false)
    expect(isWorkersAccessDenied(new Error('boom'))).toBe(false)
    expect(isWorkersAccessDenied(null)).toBe(false)
  })
})
