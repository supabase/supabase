import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable, type ColumnFiltersState } from '@tanstack/react-table'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'

import { DataTableFilterControls } from './DataTableFilterControls'
import { buildDefaultColumnFilters } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { DataTableCheckboxFilterField } from '@/components/ui/DataTable/DataTable.types'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { useUnifiedLogsFacetCountQuery } from '@/data/logs/unified-logs-facet-count-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = components['schemas']['AnalyticsResponse_Output']

const pathnameField = {
  label: 'Pathname',
  value: 'pathname',
  type: 'checkbox',
  options: [],
  hasDynamicOptions: true,
  hasAsyncSearch: true,
} satisfies DataTableCheckboxFilterField<{ pathname: string; method: string }>

const methodField = {
  label: 'Method',
  value: 'method',
  type: 'checkbox',
  options: [{ label: 'POST', value: 'POST' }],
} satisfies DataTableCheckboxFilterField<{ pathname: string; method: string }>

const columns = [
  { accessorKey: 'pathname', header: 'Pathname' },
  { accessorKey: 'method', header: 'Method' },
]
const initialDate = [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')]
const defaultPathnameSearch: QuerySearchParamsType = {
  filter: null,
  latency: null,
  'timing.dns': null,
  'timing.connection': null,
  'timing.tls': null,
  'timing.ttfb': null,
  'timing.transfer': null,
  date: initialDate,
  sort: null,
  size: 40,
  start: 0,
  direction: 'next',
  cursor: new Date('2026-05-08T10:00:00Z'),
  id: null,
  show_connection_logs: true,
  edge_auth: true,
  edge_storage: true,
  edge_postgrest: true,
  user: null,
}
const pathnameSearch = (overrides: Partial<QuerySearchParamsType> = {}): QuerySearchParamsType => ({
  ...defaultPathnameSearch,
  ...overrides,
})

function PathnameFilter({
  search,
  flagsLoaded = true,
  useOtel = false,
}: {
  search: QuerySearchParamsType
  flagsLoaded?: boolean
  useOtel?: boolean
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    buildDefaultColumnFilters(search)
  )
  const [localFilterOrigin, setLocalFilterOrigin] = useState<string | null>(null)
  const urlFilterScope = JSON.stringify([search.filter, search.date])
  useEffect(() => setLocalFilterOrigin(null), [urlFilterScope])
  const table = useReactTable({
    data: [] as { pathname: string; method: string }[],
    columns,
    state: { columnFilters },
    onColumnFiltersChange: (updater) => {
      setLocalFilterOrigin(urlFilterScope)
      setColumnFilters(updater)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <FeatureFlagContext.Provider
      value={{ configcat: { otelUnifiedLogs: useOtel }, posthog: {}, hasLoaded: flagsLoaded }}
    >
      <DataTableProvider
        table={table}
        error={null}
        columns={columns}
        filterFields={[pathnameField, methodField]}
        columnFilters={columnFilters}
        searchParameters={search}
        hasPendingFilterChange={localFilterOrigin === urlFilterScope}
        isFetching={false}
        isError={false}
        isLoading={false}
        isLoadingCounts={false}
      >
        <DataTableFilterControls />
      </DataTableProvider>
    </FeatureFlagContext.Provider>
  )
}

function ProjectFacetOptions({ projectRef }: { projectRef: string }) {
  const { data } = useUnifiedLogsFacetCountQuery({
    projectRef,
    search: pathnameSearch(),
    facet: 'pathname',
  })
  return (
    <div>
      {data?.map((option) => (
        <span key={option.value}>{option.label}</span>
      ))}
    </div>
  )
}

mockAnimationsApi()

const addProjectMock = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      id: 1,
      ref: 'default',
      organization_id: 1,
      name: 'Test Project',
      status: 'ACTIVE_HEALTHY',
      cloud_provider: 'AWS',
      region: 'us-east-1',
      db_host: 'db.default.supabase.co',
      restUrl: 'https://default.supabase.co/rest/v1/',
      inserted_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      subscription_id: 'sub_123',
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      high_availability: false,
      integration_source: null,
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
      is_hibernating: false,
    },
  })

describe('pathname facet filter', () => {
  it('waits for feature flags before requesting options', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => {
        requests += 1
        return HttpResponse.json<AnalyticsResponse>({ result: [{ value: '/ready', count: 1 }] })
      },
    })

    const search = pathnameSearch()
    const { rerender } = customRender(<PathnameFilter search={search} flagsLoaded={false} />)

    fireEvent.click(screen.getByText('Pathname'))
    expect(requests).toBe(0)
    rerender(<PathnameFilter search={search} />)
    expect(await screen.findByText('/ready')).toBeInTheDocument()
    expect(requests).toBe(1)
  })

  it('fetches on open and search, then reuses cached options for unchanged inputs', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => {
        requests += 1
        return HttpResponse.json<AnalyticsResponse>({
          result: [{ value: requests === 1 ? '/base' : '/api/items', count: 4 }],
        })
      },
    })

    const { rerender } = customRender(<PathnameFilter search={pathnameSearch()} />, {
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    })

    expect(requests).toBe(0)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/base')).toBeInTheDocument()
    expect(requests).toBe(1)

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: '/api' } })
    expect(screen.queryByText('/base')).not.toBeInTheDocument()
    expect(await screen.findByText('/api/items', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(requests).toBe(2)

    fireEvent.click(screen.getByText('Pathname'))
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/base')).toBeInTheDocument()
    expect(requests).toBe(2)

    rerender(
      <PathnameFilter search={pathnameSearch({ cursor: new Date('2026-05-08T09:30:00Z') })} />
    )
    expect(screen.getByText('/base')).toBeInTheDocument()
    expect(requests).toBe(2)
  })

  it('clears search on Escape before blurring the input', () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => HttpResponse.json<AnalyticsResponse>({ result: [] }),
    })

    customRender(<PathnameFilter search={pathnameSearch()} />)
    fireEvent.click(screen.getByText('Pathname'))
    const searchInput = screen.getByPlaceholderText('Search')
    searchInput.focus()
    fireEvent.change(searchInput, { target: { value: '/api' } })

    fireEvent.keyDown(searchInput, { key: 'Escape' })
    expect(searchInput).toHaveValue('')
    expect(searchInput).toHaveFocus()

    fireEvent.keyDown(searchInput, { key: 'Escape' })
    expect(searchInput).not.toHaveFocus()
  })

  it('replaces options on URL time-range and filter changes without syncing local filters', async () => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => {
        requests += 1
        const value = ['/initial', '/later', '/post'][requests - 1]
        return HttpResponse.json<AnalyticsResponse>({ result: [{ value, count: 2 }] })
      },
    })

    const { rerender } = customRender(
      <PathnameFilter search={pathnameSearch({ filter: ['pathname:eq:/selected'] })} />
    )

    fireEvent.click(screen.getByText('Pathname'))
    expect(screen.getByRole('checkbox', { name: /\/selected/ })).toHaveAttribute(
      'data-state',
      'checked'
    )
    expect(await screen.findByText('/initial')).toBeInTheDocument()

    rerender(
      <PathnameFilter
        search={pathnameSearch({
          date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
          filter: ['pathname:eq:/selected'],
        })}
      />
    )
    expect(screen.queryByText('/initial')).not.toBeInTheDocument()
    expect(await screen.findByText('/later')).toBeInTheDocument()

    rerender(
      <PathnameFilter
        search={pathnameSearch({
          date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
          filter: ['pathname:eq:/selected', 'method:eq:POST'],
        })}
      />
    )
    expect(screen.queryByText('/later')).not.toBeInTheDocument()
    expect(await screen.findByText('/post')).toBeInTheDocument()
    expect(requests).toBe(3)

    rerender(
      <PathnameFilter
        search={pathnameSearch({
          date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
          filter: ['method:eq:POST'],
        })}
      />
    )
    expect(screen.getByText('/post')).toBeInTheDocument()
    expect(requests).toBe(3)
  })

  it('keeps selected values visible and removable while options load', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => HttpResponse.json<AnalyticsResponse>({ result: [] }),
    })

    customRender(<PathnameFilter search={pathnameSearch({ filter: ['pathname:eq:/selected'] })} />)
    fireEvent.click(screen.getByText('Pathname'))
    const selectedCheckbox = screen.getByRole('checkbox', { name: /\/selected/ })
    expect(selectedCheckbox).toHaveAttribute('data-state', 'checked')
    fireEvent.click(selectedCheckbox)
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /\/selected/ })).toBeNull())
  })

  it('validates and orders option rows from the response', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({
          result: [
            { value: '/low', count: '1' },
            { value: '/high', count: '12' },
          ],
        }),
    })

    customRender(<PathnameFilter search={pathnameSearch()} />)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/high')).toBeInTheDocument()
    expect(screen.getAllByText(/^\/(high|low)$/).map((option) => option.textContent)).toEqual([
      '/high',
      '/low',
    ])
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('shows a validation error while keeping selected paths removable', async () => {
    addProjectMock()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({ result: [{ value: '/invalid', count: 'wrong' }] }),
    })

    customRender(<PathnameFilter search={pathnameSearch({ filter: ['pathname:eq:/selected'] })} />)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('Failed to retrieve pathnames')).toBeInTheDocument()
    expect(screen.queryByText('/invalid')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: /\/selected/ }))
    expect(screen.queryByRole('checkbox', { name: /\/selected/ })).not.toBeInTheDocument()
  })

  it('shows a validation error when the analytics response omits results', async () => {
    addProjectMock()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => HttpResponse.json<AnalyticsResponse>({}),
    })

    customRender(<PathnameFilter search={pathnameSearch()} />)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('Failed to retrieve pathnames')).toBeInTheDocument()
    expect(screen.queryByText('No results found')).not.toBeInTheDocument()
  })

  it.each([null, '', true, false, -1, 1.5, '-1', '1.5'])(
    'rejects malformed option count %s without hiding selected paths',
    async (count) => {
      addProjectMock()
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all',
        response: () =>
          HttpResponse.json<AnalyticsResponse>({ result: [{ value: '/invalid', count }] }),
      })

      customRender(
        <PathnameFilter search={pathnameSearch({ filter: ['pathname:eq:/selected'] })} />
      )
      fireEvent.click(screen.getByText('Pathname'))
      expect(await screen.findByText('Failed to retrieve pathnames')).toBeInTheDocument()
      expect(screen.queryByText('/invalid')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('checkbox', { name: /\/selected/ }))
      expect(screen.queryByRole('checkbox', { name: /\/selected/ })).not.toBeInTheDocument()
    }
  )

  it.each([
    { error: 'Analytics unavailable', message: 'Analytics unavailable' },
    {
      error: {
        code: 503,
        errors: [],
        message: 'Analytics service unavailable',
        status: 'UNAVAILABLE',
      },
      message: 'Analytics service unavailable',
    },
  ])(
    'shows analytics error $message without treating missing results as empty options',
    async ({ error, message }) => {
      addProjectMock()
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all',
        response: () => HttpResponse.json<AnalyticsResponse>({ error }),
      })

      customRender(<PathnameFilter search={pathnameSearch()} />)
      fireEvent.click(screen.getByText('Pathname'))
      expect(await screen.findByText('Failed to retrieve pathnames')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(screen.queryByText('No results found')).not.toBeInTheDocument()
    }
  )

  it('loads and displays options from the OTEL endpoint when that backend is enabled', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({ result: [{ value: '/otel', count: '3' }] }),
    })

    customRender(<PathnameFilter search={pathnameSearch()} useOtel />)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByRole('checkbox', { name: /\/otel/ })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('replaces project options without showing cached paths from another project', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: ({ params }) =>
        HttpResponse.json<AnalyticsResponse>({
          result: [{ value: params.ref === 'project-a' ? '/project-a' : '/project-b', count: 1 }],
        }),
    })

    const renderProject = (projectRef: string) => (
      <FeatureFlagContext.Provider
        value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: true }}
      >
        <ProjectFacetOptions projectRef={projectRef} />
      </FeatureFlagContext.Provider>
    )
    const { rerender } = customRender(renderProject('project-a'))
    expect(await screen.findByText('/project-a')).toBeInTheDocument()

    rerender(renderProject('project-b'))
    expect(screen.queryByText('/project-a')).not.toBeInTheDocument()
    expect(await screen.findByText('/project-b')).toBeInTheDocument()
  })
})
