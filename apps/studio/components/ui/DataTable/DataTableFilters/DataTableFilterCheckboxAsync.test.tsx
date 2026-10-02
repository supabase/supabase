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
import { logsKeys } from '@/data/logs/keys'
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

function PathnameFilter({
  search,
  flagsLoaded = true,
}: {
  search: QuerySearchParamsType
  flagsLoaded?: boolean
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
      value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: flagsLoaded }}
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

mockAnimationsApi()

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

    const search = { date: initialDate } as QuerySearchParamsType
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

    customRender(<PathnameFilter search={{ date: initialDate } as QuerySearchParamsType} />, {
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
      <PathnameFilter
        search={{ date: initialDate, filter: ['pathname:eq:/selected'] } as QuerySearchParamsType}
      />
    )

    fireEvent.click(screen.getByText('Pathname'))
    expect(screen.getByRole('checkbox', { name: /\/selected/ })).toHaveAttribute(
      'data-state',
      'checked'
    )
    expect(await screen.findByText('/initial')).toBeInTheDocument()

    rerender(
      <PathnameFilter
        search={
          {
            date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
            filter: ['pathname:eq:/selected'],
          } as QuerySearchParamsType
        }
      />
    )
    expect(screen.queryByText('/initial')).not.toBeInTheDocument()
    expect(await screen.findByText('/later')).toBeInTheDocument()

    rerender(
      <PathnameFilter
        search={
          {
            date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
            filter: ['pathname:eq:/selected', 'method:eq:POST'],
          } as QuerySearchParamsType
        }
      />
    )
    expect(screen.queryByText('/later')).not.toBeInTheDocument()
    expect(await screen.findByText('/post')).toBeInTheDocument()
    expect(requests).toBe(3)

    rerender(
      <PathnameFilter
        search={
          {
            date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
            filter: ['method:eq:POST'],
          } as QuerySearchParamsType
        }
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

    customRender(
      <PathnameFilter
        search={{ date: initialDate, filter: ['pathname:eq:/selected'] } as QuerySearchParamsType}
      />
    )
    fireEvent.click(screen.getByText('Pathname'))
    const selectedCheckbox = screen.getByRole('checkbox', { name: /\/selected/ })
    expect(selectedCheckbox).toHaveAttribute('data-state', 'checked')
    fireEvent.click(selectedCheckbox)
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /\/selected/ })).toBeNull())
  })

  it('uses changed sidebar filters before the URL update completes', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () => {
        requests += 1
        return HttpResponse.json<AnalyticsResponse>({
          result: [{ value: requests === 1 ? '/before' : '/after', count: 1 }],
        })
      },
    })

    const { rerender } = customRender(
      <PathnameFilter search={{ date: initialDate } as QuerySearchParamsType} />,
      { queryClient }
    )
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/before')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Method'))
    fireEvent.click(screen.getByRole('checkbox', { name: /POST/ }))
    expect(screen.queryByText('/before')).not.toBeInTheDocument()
    expect(await screen.findByText('/after')).toBeInTheDocument()
    expect(requests).toBe(2)
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .some(
          (query) =>
            query.queryKey[4] === 'pathname' &&
            (query.queryKey[6] as QuerySearchParamsType).filter?.includes('method:eq:POST')
        )
    ).toBe(true)

    rerender(
      <PathnameFilter
        search={{ date: initialDate, filter: ['method:eq:POST'] } as QuerySearchParamsType}
      />
    )
    expect(screen.getByText('/after')).toBeInTheDocument()
    expect(requests).toBe(2)
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

    customRender(<PathnameFilter search={{ date: initialDate } as QuerySearchParamsType} />)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/high')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.id)).toEqual([
      'pathname-/high',
      'pathname-/low',
    ])
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('shows a validation error while keeping selected paths removable', async () => {
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
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({ result: [{ value: '/invalid', count: 'wrong' }] }),
    })

    customRender(
      <PathnameFilter
        search={{ date: initialDate, filter: ['pathname:eq:/selected'] } as QuerySearchParamsType}
      />
    )
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('Failed to retrieve pathnames')).toBeInTheDocument()
    expect(screen.queryByText('/invalid')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: /\/selected/ }))
    expect(screen.queryByRole('checkbox', { name: /\/selected/ })).not.toBeInTheDocument()
  })

  it('keys cached options by project, time range, and filters', () => {
    const search = { date: initialDate, filter: ['method:eq:GET'] } as QuerySearchParamsType
    const key = logsKeys.unifiedLogsFacetCount('project-a', 'pathname', '', search)

    expect(logsKeys.unifiedLogsFacetCount('project-b', 'pathname', '', search)).not.toEqual(key)
    expect(
      logsKeys.unifiedLogsFacetCount('project-a', 'pathname', '', {
        ...search,
        date: [new Date('2026-05-09T09:00:00Z'), new Date('2026-05-09T10:00:00Z')],
      })
    ).not.toEqual(key)
    expect(
      logsKeys.unifiedLogsFacetCount('project-a', 'pathname', '', {
        ...search,
        filter: ['method:eq:POST'],
      })
    ).not.toEqual(key)
  })
})
