import { describe, expect, it } from 'vitest'

import { getWorkerStateMeta, WORKER_NAME_WORDS, workerUrl } from './Workers.constants'
import type { Worker } from './Workers.types'
import {
  buildWorkerLogsColumnFilters,
  buildWorkerLogsSearchParameters,
  filterWorkers,
  formatResources,
  formatRuntime,
  formatSize,
  generateWorkerName,
  getPage,
  getVisibleWorkerLogStreams,
  getWorkerLogStream,
  isWorkersForbidden,
  isWorkersUnavailable,
} from './Workers.utils'
import type { SearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
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

  it('labels an omitted runtime as custom', () => {
    expect(formatRuntime(undefined)).toBe('Custom')
  })
})

describe('formatResources', () => {
  it('combines size and declared instance count', () => {
    expect(formatResources(worker({ name: 'embed', declaredInstances: 3 }))).toBe(
      '2 GB · 1 vCPU · 3 inst'
    )
  })
})

describe('workers error classification', () => {
  const responseError = (code?: number) => new ResponseError('Denied', code)

  it('reads a 404 as the project being outside the alpha allow-list', () => {
    expect(isWorkersUnavailable(responseError(404))).toBe(true)
    expect(isWorkersForbidden(responseError(404))).toBe(false)
  })

  it('reads a 403 as a missing workers permission, not a missing enrollment', () => {
    expect(isWorkersForbidden(responseError(403))).toBe(true)
    expect(isWorkersUnavailable(responseError(403))).toBe(false)
  })

  it('leaves other failures to the generic error UI', () => {
    for (const error of [responseError(500), responseError(undefined), new Error('boom'), null]) {
      expect(isWorkersUnavailable(error)).toBe(false)
      expect(isWorkersForbidden(error)).toBe(false)
    }
  })
})

describe('workerUrl', () => {
  it('answers on the project domain alongside /functions/v1', () => {
    expect(workerUrl({ endpoint: 'abcdefgh.supabase.co', name: 'embed' })).toBe(
      'https://abcdefgh.supabase.co/workers/v1/embed'
    )
  })

  it('honors a non-https protocol', () => {
    expect(workerUrl({ endpoint: 'localhost:8000', protocol: 'http', name: 'embed' })).toBe(
      'http://localhost:8000/workers/v1/embed'
    )
  })

  it('has no url until the project settings resolve', () => {
    expect(workerUrl({ endpoint: undefined, name: 'embed' })).toBeUndefined()
  })
})

describe('generateWorkerName', () => {
  it('produces a name that already passes the CLI naming rules', () => {
    const name = generateWorkerName()
    expect(name).toMatch(/^worker-[a-z]+-\d{6}$/)
    expect(WORKER_NAME_WORDS).toContain(name.split('-')[1])
  })

  it('varies across calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateWorkerName()))
    expect(names.size).toBeGreaterThan(1)
  })
})

describe('getWorkerStateMeta', () => {
  it('labels every build state', () => {
    expect(getWorkerStateMeta(worker({ name: 'a', buildState: 'building' })).label).toBe('Building')
    expect(getWorkerStateMeta(worker({ name: 'a', buildState: 'active' })).label).toBe('Active')
    expect(getWorkerStateMeta(worker({ name: 'a', buildState: 'failed' })).label).toBe('Failed')
  })

  it('reports deleting over the build state', () => {
    expect(
      getWorkerStateMeta(worker({ name: 'a', buildState: 'active', isDeleting: true })).label
    ).toBe('Deleting')
  })
})

describe('getWorkerLogStream', () => {
  it('maps each OTEL source attribute to its stream', () => {
    expect(getWorkerLogStream({ source: 'worker_ingress_logs' })).toBe('requests')
    expect(getWorkerLogStream({ source: 'worker_guest_logs' })).toBe('output')
    expect(getWorkerLogStream({ source: 'worker_api_logs' })).toBe('builds')
  })

  it('returns undefined for unknown or missing metadata', () => {
    expect(getWorkerLogStream({ source: 'edge_logs' })).toBeUndefined()
    expect(getWorkerLogStream(null)).toBeUndefined()
    expect(getWorkerLogStream(undefined)).toBeUndefined()
  })
})

describe('getVisibleWorkerLogStreams', () => {
  it('shows every stream unless its view option is explicitly off', () => {
    expect(
      getVisibleWorkerLogStreams({
        worker_requests: true,
        worker_output: true,
        worker_builds: true,
      })
    ).toEqual(['requests', 'output', 'builds'])
    expect(
      getVisibleWorkerLogStreams({
        worker_requests: true,
        worker_output: false,
        worker_builds: true,
      })
    ).toEqual(['requests', 'builds'])
  })
})

describe('buildWorkerLogsSearchParameters', () => {
  const search = { id: 'row', live: false, size: 40 } as SearchParamsType

  it('always scopes the query to the workers log type and the given worker', () => {
    expect(buildWorkerLogsSearchParameters(search, 'embed')).toEqual({
      size: 40,
      filter: ['log_type:eq:workers', 'worker:eq:embed'],
    })
  })

  it('keeps other filters but drops any log_type / worker filters from the URL', () => {
    const result = buildWorkerLogsSearchParameters(
      {
        ...search,
        filter: ['log_type:eq:postgres', 'worker:eq:other', 'event_message:ilike:timeout'],
      },
      'embed'
    )
    expect(result.filter).toEqual([
      'event_message:ilike:timeout',
      'log_type:eq:workers',
      'worker:eq:embed',
    ])
  })

  it('falls back to the seeded date column filter until the URL carries a range', () => {
    const range = [new Date('2026-09-08T10:00:00Z'), new Date('2026-09-09T10:00:00Z')]
    const seeded = buildWorkerLogsSearchParameters(search, 'embed', [{ id: 'date', value: range }])
    expect(seeded.date).toEqual(range)

    const urlRange = [new Date('2026-09-09T09:00:00Z'), new Date('2026-09-09T10:00:00Z')]
    const fromUrl = buildWorkerLogsSearchParameters({ ...search, date: urlRange }, 'embed', [
      { id: 'date', value: range },
    ])
    expect(fromUrl.date).toEqual(urlRange)
  })
})

describe('buildWorkerLogsColumnFilters', () => {
  const now = new Date('2026-09-09T10:00:00Z')

  it('defaults the time range to the last 24 hours when the URL has none', () => {
    expect(buildWorkerLogsColumnFilters({ filter: null, date: null }, now)).toEqual([
      { id: 'date', value: [new Date('2026-09-08T10:00:00Z'), now] },
    ])
  })

  it('keeps a range and filters that came from the URL', () => {
    const range = [new Date('2026-09-01T00:00:00Z'), new Date('2026-09-02T00:00:00Z')]
    expect(
      buildWorkerLogsColumnFilters({ filter: ['event_message:ilike:boom'], date: range }, now)
    ).toEqual([
      { id: 'event_message', value: { operator: '~~*', values: ['boom'] } },
      { id: 'date', value: range },
    ])
  })
})
