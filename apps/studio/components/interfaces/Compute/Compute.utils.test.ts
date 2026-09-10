import { describe, expect, it } from 'vitest'

import {
  COMPUTE_INSTANCE_NAME_WORDS,
  computeInstanceUrl,
  getComputeInstanceStateMeta,
} from './Compute.constants'
import type { ComputeInstance } from './Compute.types'
import {
  filterComputeInstances,
  formatResources,
  formatRuntime,
  formatSize,
  generateComputeInstanceName,
  getPage,
  isComputeForbidden,
  isComputeUnavailable,
} from './Compute.utils'
import { ResponseError } from '@/types'

const instance = (
  overrides: Partial<ComputeInstance> & Pick<ComputeInstance, 'name'>
): ComputeInstance => ({
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 1,
  ...overrides,
})

const NO_FILTERS = { search: '', state: 'all', access: 'all' } as const

describe('filterComputeInstances', () => {
  const instances = [
    instance({ name: 'embed', buildState: 'active', access: 'public' }),
    instance({ name: 'resize-images', buildState: 'building', access: 'private' }),
    instance({ name: 'embed-batch', buildState: 'failed', access: 'public' }),
  ]

  it('returns every instance when no filters are set', () => {
    expect(filterComputeInstances(instances, NO_FILTERS)).toHaveLength(3)
  })

  it('matches names case-insensitively on a partial term', () => {
    const names = filterComputeInstances(instances, { ...NO_FILTERS, search: 'EMBED' }).map(
      (i) => i.name
    )
    expect(names).toEqual(['embed', 'embed-batch'])
  })

  it('ignores surrounding whitespace in the search term', () => {
    expect(filterComputeInstances(instances, { ...NO_FILTERS, search: '  resize  ' })).toHaveLength(
      1
    )
  })

  it('filters by build state and by access', () => {
    expect(
      filterComputeInstances(instances, { ...NO_FILTERS, state: 'failed' }).map((i) => i.name)
    ).toEqual(['embed-batch'])
    expect(
      filterComputeInstances(instances, { ...NO_FILTERS, access: 'private' }).map((i) => i.name)
    ).toEqual(['resize-images'])
  })

  it('combines filters', () => {
    expect(
      filterComputeInstances(instances, { search: 'embed', state: 'active', access: 'public' })
    ).toEqual([instances[0]])
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

  it('labels an omitted runtime as custom', () => {
    expect(formatRuntime(undefined)).toBe('Custom')
  })
})

describe('formatResources', () => {
  it('combines size and declared instance count', () => {
    expect(formatResources(instance({ name: 'embed', declaredInstances: 3 }))).toBe(
      '2 GB · 1 vCPU · 3 inst'
    )
  })
})

describe('compute error classification', () => {
  const responseError = (code?: number) => new ResponseError('Denied', code)

  it('reads a 404 as the project being outside the alpha allow-list', () => {
    expect(isComputeUnavailable(responseError(404))).toBe(true)
    expect(isComputeForbidden(responseError(404))).toBe(false)
  })

  it('reads a 403 as a missing compute permission, not a missing enrollment', () => {
    expect(isComputeForbidden(responseError(403))).toBe(true)
    expect(isComputeUnavailable(responseError(403))).toBe(false)
  })

  it('leaves other failures to the generic error UI', () => {
    for (const error of [responseError(500), responseError(undefined), new Error('boom'), null]) {
      expect(isComputeUnavailable(error)).toBe(false)
      expect(isComputeForbidden(error)).toBe(false)
    }
  })
})

describe('computeInstanceUrl', () => {
  it('answers on the project domain alongside /compute/v1', () => {
    expect(computeInstanceUrl({ endpoint: 'abcdefgh.supabase.co', name: 'embed' })).toBe(
      'https://abcdefgh.supabase.co/compute/v1/embed'
    )
  })

  it('honors a non-https protocol', () => {
    expect(
      computeInstanceUrl({ endpoint: 'localhost:8000', protocol: 'http', name: 'embed' })
    ).toBe('http://localhost:8000/compute/v1/embed')
  })

  it('has no url until the project settings resolve', () => {
    expect(computeInstanceUrl({ endpoint: undefined, name: 'embed' })).toBeUndefined()
  })
})

describe('generateComputeInstanceName', () => {
  it('produces a name that already passes the CLI naming rules', () => {
    const name = generateComputeInstanceName()
    expect(name).toMatch(/^compute-[a-z]+-\d{6}$/)
    expect(COMPUTE_INSTANCE_NAME_WORDS).toContain(name.split('-')[1])
  })

  it('varies across calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateComputeInstanceName()))
    expect(names.size).toBeGreaterThan(1)
  })
})

describe('getComputeInstanceStateMeta', () => {
  it('labels every build state', () => {
    expect(getComputeInstanceStateMeta(instance({ name: 'a', buildState: 'building' })).label).toBe(
      'Building'
    )
    expect(getComputeInstanceStateMeta(instance({ name: 'a', buildState: 'active' })).label).toBe(
      'Active'
    )
    expect(getComputeInstanceStateMeta(instance({ name: 'a', buildState: 'failed' })).label).toBe(
      'Failed'
    )
  })

  it('reports deleting over the build state', () => {
    expect(
      getComputeInstanceStateMeta(instance({ name: 'a', buildState: 'active', isDeleting: true }))
        .label
    ).toBe('Deleting')
  })
})
