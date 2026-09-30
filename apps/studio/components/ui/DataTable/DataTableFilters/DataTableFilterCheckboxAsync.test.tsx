import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable, type ColumnFiltersState } from '@tanstack/react-table'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { DataTableFilterControls } from './DataTableFilterControls'
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
} satisfies DataTableCheckboxFilterField<{ pathname: string }>

const columns = [{ accessorKey: 'pathname', header: 'Pathname' }]
const initialDate = [new Date('2026-05-08T09:00:00Z'), new Date('2026-05-08T10:00:00Z')]

function PathnameFilter({
  search,
  selected = [],
  flagsLoaded = true,
}: {
  search: QuerySearchParamsType
  selected?: string[]
  flagsLoaded?: boolean
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    selected.length ? [{ id: 'pathname', value: { operator: '=', values: selected } }] : []
  )
  const table = useReactTable({
    data: [] as { pathname: string }[],
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
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
        filterFields={[pathnameField]}
        columnFilters={columnFilters}
        searchParameters={search}
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
    const requests: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const body = (await request.json()) as { sql: string }
        requests.push(body.sql)
        return HttpResponse.json<AnalyticsResponse>({
          result: [
            { value: body.sql.includes("LIKE '%/api%'") ? '/api/items' : '/base', count: 4 },
          ],
        })
      },
    })

    customRender(<PathnameFilter search={{ date: initialDate } as QuerySearchParamsType} />, {
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    })

    expect(requests).toHaveLength(0)
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/base')).toBeInTheDocument()
    expect(requests).toHaveLength(1)

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: '/api' } })
    expect(screen.queryByText('/base')).not.toBeInTheDocument()
    expect(await screen.findByText('/api/items', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(requests).toHaveLength(2)

    fireEvent.click(screen.getByText('Pathname'))
    fireEvent.click(screen.getByText('Pathname'))
    expect(await screen.findByText('/base')).toBeInTheDocument()
    expect(requests).toHaveLength(2)
  })

  it('replaces options when time range or another filter changes and keeps selected values removable', async () => {
    const requests: Array<{ sql: string; start: string }> = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const body = (await request.json()) as { sql: string; iso_timestamp_start: string }
        requests.push({ sql: body.sql, start: body.iso_timestamp_start })
        let value = '/initial'
        if (body.iso_timestamp_start.startsWith('2026-05-09')) value = '/later'
        if (body.sql.includes("IN ('POST')")) value = '/post'
        return HttpResponse.json<AnalyticsResponse>({ result: [{ value, count: 2 }] })
      },
    })

    const { rerender } = customRender(
      <PathnameFilter
        search={{ date: initialDate, filter: ['pathname:eq:/selected'] } as QuerySearchParamsType}
        selected={['/selected']}
      />
    )

    fireEvent.click(screen.getByText('Pathname'))
    const selectedCheckbox = screen.getByRole('checkbox', { name: /\/selected/ })
    expect(selectedCheckbox).toHaveAttribute('data-state', 'checked')
    expect(await screen.findByText('/initial')).toBeInTheDocument()
    expect(requests[0].sql).not.toContain("LIKE '%/selected%'")

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
    expect(requests).toHaveLength(3)

    fireEvent.click(selectedCheckbox)
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /\/selected/ })).toBeNull())
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
    expect(requests).toHaveLength(3)
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
