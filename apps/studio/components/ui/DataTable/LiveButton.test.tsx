import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DataTableFilterTimerange } from './DataTableFilters/DataTableFilterTimerange'
import { LiveButton } from './LiveButton'
import { DataTableProvider } from './providers/DataTableProvider'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { customRender } from '@/tests/lib/custom-render'

const searchParamsParser = SEARCH_PARAMS_PARSER
const columns = [{ accessorKey: 'date' }]
const data = [{ date: '2025-01-01' }, { date: '2026-01-01' }]
type PollResult = { isCatchingUp: boolean }

function LiveTable({
  fetchPreviousPage,
  hasDateControls = false,
  durationSeconds,
}: {
  fetchPreviousPage: () => Promise<PollResult>
  hasDateControls?: boolean
  durationSeconds?: number
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    hasDateControls ? [{ id: 'date', value: '2025' }] : []
  )
  const [sorting, setSorting] = useState<SortingState>(
    hasDateControls ? [{ id: 'date', desc: true }] : []
  )
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, sorting },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <DataTableProvider
      table={table}
      columns={columns}
      filterFields={[]}
      error={null}
      isFetching={false}
      isError={false}
      isLoading={false}
      isLoadingCounts={false}
    >
      <LiveButton onPoll={fetchPreviousPage} searchParamsParser={searchParamsParser} />
      {durationSeconds !== undefined && (
        <DataTableFilterTimerange
          type="timerange"
          value="date"
          label="Time range"
          durationSeconds={durationSeconds}
        />
      )}
      <ul aria-label="Log dates">
        {table.getRowModel().rows.map((row) => (
          <li key={row.id}>{row.original.date}</li>
        ))}
      </ul>
    </DataTableProvider>
  )
}

describe('LiveButton', () => {
  const fetchPreviousPage = vi.fn<() => Promise<PollResult>>()

  beforeEach(() => {
    vi.useFakeTimers()
    fetchPreviousPage.mockReset().mockResolvedValue({ isCatchingUp: false })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const renderLiveTable = () =>
    customRender(<LiveTable fetchPreviousPage={fetchPreviousPage} />, {
      nuqs: { hasMemory: true, searchParams: '?live=true' },
    })

  it('enables live mode and clears date-based table controls', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<LiveTable fetchPreviousPage={fetchPreviousPage} hasDateControls />, {
      nuqs: {
        hasMemory: true,
        searchParams: '?date=1735689600000-1735689610000&sort=date.desc',
        onUrlUpdate,
      },
    })
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['2025-01-01'])

    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    await act(() => vi.advanceTimersByTimeAsync(1))

    const updated = new URLSearchParams(onUrlUpdate.mock.lastCall?.[0].queryString)
    expect(updated.get('live')).toBe('true')
    expect(updated.get('durationSeconds')).toBe('10')
    expect(updated.has('date')).toBe(false)
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '2025-01-01',
      '2026-01-01',
    ])
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('stops polling after live mode is disabled', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<LiveTable fetchPreviousPage={fetchPreviousPage} />, {
      nuqs: { hasMemory: true, searchParams: '?live=true&durationSeconds=10', onUrlUpdate },
    })
    await act(async () => {})
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
    const updated = new URLSearchParams(onUrlUpdate.mock.lastCall?.[0].queryString)
    expect(updated.get('durationSeconds')).toBe('10')
    expect(updated.has('date')).toBe(false)
  })

  it('keeps the implicit default scope when enabling live mode', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<LiveTable fetchPreviousPage={fetchPreviousPage} />, {
      nuqs: { hasMemory: true, onUrlUpdate },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    await act(() => vi.advanceTimersByTimeAsync(1))
    const updated = new URLSearchParams(onUrlUpdate.mock.lastCall?.[0].queryString)
    expect(updated.get('live')).toBe('true')
    expect(updated.has('durationSeconds')).toBe(false)
  })

  it.each([
    [1, 'Last 1 second'],
    [10, 'Last 10 seconds'],
  ] as const)('labels the selected %s-second duration while paused', (durationSeconds, label) => {
    customRender(
      <LiveTable fetchPreviousPage={fetchPreviousPage} durationSeconds={durationSeconds} />,
      {
        nuqs: { hasMemory: true, searchParams: `?durationSeconds=${durationSeconds}` },
      }
    )
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    expect(fetchPreviousPage).not.toHaveBeenCalled()
  })

  it('continues catching up after 250ms and returns to the idle interval when caught up', async () => {
    fetchPreviousPage.mockResolvedValueOnce({ isCatchingUp: true })
    renderLiveTable()
    await act(async () => {})
    await act(() => vi.advanceTimersByTimeAsync(249))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(3)
  })

  it('does not resume polling when a pending request settles after disabling live mode', async () => {
    const pendingRequest = Promise.withResolvers<PollResult>()
    fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    renderLiveTable()

    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    await act(async () => pendingRequest.resolve({ isCatchingUp: false }))
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('does not resume polling when a pending request settles after unmounting', async () => {
    const pendingRequest = Promise.withResolvers<PollResult>()
    fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    const { unmount } = renderLiveTable()

    unmount()
    await act(async () => pendingRequest.resolve({ isCatchingUp: false }))
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('starts only one polling loop when live mode is re-enabled during a pending request', async () => {
    const pendingRequest = Promise.withResolvers<PollResult>()
    fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    renderLiveTable()

    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    await act(async () => pendingRequest.resolve({ isCatchingUp: false }))

    expect(fetchPreviousPage).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(5)
  })

  it('retries after a rejected poll at the next interval', async () => {
    const pendingRequest = Promise.withResolvers<PollResult>()
    fetchPreviousPage.mockReturnValueOnce(pendingRequest.promise)
    renderLiveTable()

    await act(async () => pendingRequest.reject(new Error('Request failed')))
    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchPreviousPage).toHaveBeenCalledTimes(2)
  })
})
