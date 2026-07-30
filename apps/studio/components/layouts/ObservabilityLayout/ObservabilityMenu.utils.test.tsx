import { renderHook } from '@testing-library/react'
import { useFlag, useParams } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useGenerateCustomReportsMenu,
  useGenerateObservabilityMenu,
} from './ObservabilityMenu.utils'
import { useSupamonitorStatus } from '@/components/interfaces/QueryPerformance/hooks/useSupamonitorStatus'
import { useContentQuery } from '@/data/content/content-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { routerMock } from '@/tests/lib/route-mock'

const { REF, mockIsPlatform } = vi.hoisted(() => ({
  REF: 'project-ref',
  mockIsPlatform: { value: true },
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('common', () => ({
  useFlag: vi.fn().mockReturnValue(false),
  useParams: vi.fn().mockReturnValue({ ref: REF }),
}))

vi.mock('@/components/interfaces/QueryPerformance/hooks/useSupamonitorStatus', () => ({
  useSupamonitorStatus: vi.fn(),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: vi.fn(),
}))

vi.mock('@/data/content/content-query', () => ({
  useContentQuery: vi.fn(),
}))

describe('useGenerateObservabilityMenu', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    routerMock.setCurrentUrl(`/project/${REF}/observability`)
    vi.mocked(useFlag).mockReturnValue(false)
    vi.mocked(useParams).mockReturnValue({ ref: REF })
    vi.mocked(useSupamonitorStatus).mockReturnValue({
      isSupamonitorEnabled: false,
      isLoading: false,
    })
    vi.mocked(useIsFeatureEnabled).mockReturnValue(true)
  })

  it('always includes the GENERAL section', () => {
    const { result } = renderHook(() => useGenerateObservabilityMenu())

    expect(result.current.some((section) => section.title === 'GENERAL')).toBe(true)
  })

  it('includes Overview when the observabilityOverview flag is enabled', () => {
    vi.mocked(useFlag).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'observability')).toBe(true)
  })

  it('excludes Overview when the observabilityOverview flag is disabled', () => {
    vi.mocked(useFlag).mockReturnValue(false)

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'observability')).toBe(false)
  })

  it('shows Query Performance when supamonitor is disabled', () => {
    vi.mocked(useSupamonitorStatus).mockReturnValue({
      isSupamonitorEnabled: false,
      isLoading: false,
    })

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'query-performance')).toBe(true)
    expect(general?.items.some((item) => item.key === 'query-insights')).toBe(false)
  })

  it('shows Query Insights when supamonitor is enabled', () => {
    vi.mocked(useSupamonitorStatus).mockReturnValue({
      isSupamonitorEnabled: true,
      isLoading: false,
    })

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'query-insights')).toBe(true)
    expect(general?.items.some((item) => item.key === 'query-performance')).toBe(false)
  })

  it('includes API Gateway and the PRODUCT section on platform', () => {
    mockIsPlatform.value = true

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'api-overview')).toBe(true)
    expect(result.current.some((section) => section.title === 'PRODUCT')).toBe(true)
  })

  it('excludes API Gateway and the PRODUCT section in self-hosted mode', () => {
    mockIsPlatform.value = false

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const general = result.current.find((section) => section.title === 'GENERAL')

    expect(general?.items.some((item) => item.key === 'api-overview')).toBe(false)
    expect(result.current.some((section) => section.title === 'PRODUCT')).toBe(false)
    expect(result.current.length).toBe(1)
  })

  it('includes Storage in the PRODUCT section when project_storage:all is enabled', () => {
    vi.mocked(useIsFeatureEnabled).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')

    expect(product?.items.some((item) => item.key === 'storage')).toBe(true)
    expect(useIsFeatureEnabled).toHaveBeenCalledWith('project_storage:all')
  })

  it('excludes Storage from the PRODUCT section when project_storage:all is disabled', () => {
    vi.mocked(useIsFeatureEnabled).mockReturnValue(false)

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')

    expect(product?.items.some((item) => item.key === 'storage')).toBe(false)
  })

  it('always includes Database, Data API, Auth, Edge Functions, and Realtime in the PRODUCT section', () => {
    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')

    expect(product?.items.map((item) => item.key)).toEqual(
      expect.arrayContaining(['database', 'postgrest', 'auth', 'edge-functions', 'realtime'])
    )
  })

  it('builds menu item URLs using the project ref', () => {
    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')
    const database = product?.items.find((item) => item.key === 'database')

    expect(database?.url).toBe(`/project/${REF}/observability/database`)
  })

  it('handles an undefined project ref', () => {
    vi.mocked(useParams).mockReturnValue({ ref: undefined })

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')
    const database = product?.items.find((item) => item.key === 'database')

    expect(database?.url).toBe('/project/undefined/observability/database')
  })

  it('preserves date range and helper query params across menu item URLs', () => {
    routerMock.setCurrentUrl(
      `/project/${REF}/observability?its=2024-01-01&ite=2024-01-31&isHelper=true&helperText=hello`
    )

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')
    const database = product?.items.find((item) => item.key === 'database')

    expect(database?.url).toBe(
      `/project/${REF}/observability/database?its=2024-01-01&ite=2024-01-31&isHelper=true&helperText=hello`
    )
  })

  it('ignores query param values that are not plain strings (e.g. duplicated keys)', () => {
    routerMock.setCurrentUrl(`/project/${REF}/observability?its=2024-01-01&its=2024-02-01`)

    const { result } = renderHook(() => useGenerateObservabilityMenu())
    const product = result.current.find((section) => section.title === 'PRODUCT')
    const database = product?.items.find((item) => item.key === 'database')

    expect(database?.url).toBe(`/project/${REF}/observability/database`)
  })
})

describe('useGenerateCustomReportsMenu', () => {
  const buildReport = (overrides: Record<string, unknown> = {}) => ({
    id: 'report-1',
    name: 'Report',
    description: '',
    type: 'report',
    content: {},
    ...overrides,
  })

  beforeEach(() => {
    routerMock.setCurrentUrl(`/project/${REF}/observability`)
  })

  it('returns an empty array and reports loading while content is pending', () => {
    vi.mocked(useContentQuery).mockReturnValue({ data: undefined, isPending: true } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toEqual([])
  })

  it('returns an empty array when there is no content', () => {
    vi.mocked(useContentQuery).mockReturnValue({ data: undefined, isPending: false } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual([])
  })

  it('filters out non-report content', () => {
    vi.mocked(useContentQuery).mockReturnValue({
      data: {
        cursor: null,
        content: [
          buildReport({ id: 'r1', name: 'A Report' }),
          { id: 'sql-1', name: 'A snippet', description: '', type: 'sql', content: {} },
        ],
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0].id).toBe('r1')
  })

  it('sorts reports alphabetically by name', () => {
    vi.mocked(useContentQuery).mockReturnValue({
      data: {
        cursor: null,
        content: [
          buildReport({ id: 'r2', name: 'Zebra' }),
          buildReport({ id: 'r1', name: 'Apple' }),
        ],
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.data.map((item) => item.name)).toEqual(['Apple', 'Zebra'])
  })

  it('builds report URLs preserving query params and defaults a missing description to an empty string', () => {
    routerMock.setCurrentUrl(`/project/${REF}/observability?its=2024-01-01`)
    vi.mocked(useContentQuery).mockReturnValue({
      data: {
        cursor: null,
        content: [buildReport({ id: 'r1', name: 'Report', description: undefined })],
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.data[0].url).toBe(`/project/${REF}/observability/r1?its=2024-01-01`)
    expect(result.current.data[0].description).toBe('')
  })

  it('falls back to an index-based key when the report id is missing', () => {
    vi.mocked(useContentQuery).mockReturnValue({
      data: {
        cursor: null,
        content: [buildReport({ id: undefined, name: 'Report' })],
      },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.data[0].key).toBe('0-report')
  })

  it('marks every report item as having dropdown actions and carries the raw report', () => {
    const report = buildReport({ id: 'r1', name: 'Report' })
    vi.mocked(useContentQuery).mockReturnValue({
      data: { cursor: null, content: [report] },
      isPending: false,
    } as any)

    const { result } = renderHook(() => useGenerateCustomReportsMenu())

    expect(result.current.data[0].hasDropdownActions).toBe(true)
    expect(result.current.data[0].report).toEqual(report)
  })
})
