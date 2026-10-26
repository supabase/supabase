import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { fireEvent, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { LogsTable } from './LogsTable'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { customRender } from '@/tests/lib/custom-render'

type ActivityLog = { request_id: string; action: string }

const rows: ActivityLog[] = [
  { request_id: 'req-1', action: 'Created project' },
  { request_id: 'req-2', action: 'Paused project' },
]
const columns: ColumnDef<ActivityLog>[] = [{ accessorKey: 'action', header: 'Event' }]

const ActivityLogs = ({
  onSelectRow = vi.fn(),
  fetchNextPage = vi.fn(),
  footer,
  isLoading = false,
  data = rows,
}: {
  onSelectRow?: (id: string) => void
  fetchNextPage?: () => Promise<void>
  footer?: ReactNode
  isLoading?: boolean
  data?: ActivityLog[]
}) => {
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.request_id,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTableProvider
      table={table}
      columns={columns}
      filterFields={[]}
      error={null}
      isError={false}
      isLoading={isLoading}
      isFetching={false}
      isLoadingCounts={false}
      onSelectRow={onSelectRow}
    >
      <LogsTable
        columns={columns}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
        setColumnOrder={vi.fn()}
        setColumnVisibility={vi.fn()}
        footer={footer}
      />
    </DataTableProvider>
  )
}

describe('LogsTable', () => {
  it('opens a selected activity log using the caller’s row identifier', () => {
    const onSelectRow = vi.fn()
    customRender(<ActivityLogs onSelectRow={onSelectRow} footer={<p>Viewing 2 logs</p>} />)

    const table = within(screen.getByRole('table'))
    expect(table.getByText('Event')).toBeInTheDocument()
    expect(table.getByText('Viewing 2 logs')).toBeInTheDocument()

    fireEvent.click(table.getByText('Paused project'))
    expect(onSelectRow).toHaveBeenCalledWith('req-2', expect.anything())
  })

  it.each([
    ['a preview link', <p key="footer">View all logs</p>, false],
    ['no footer', null, false],
    ['default pagination', undefined, true],
  ])('controls scroll pagination for %s', (_, footer, shouldFetch) => {
    const fetchNextPage = vi.fn(async () => {})
    customRender(<ActivityLogs footer={footer} fetchNextPage={fetchNextPage} />)

    const scrollContainer = screen.getByRole('table').parentElement
    if (!scrollContainer) throw new Error('Table scroll container is missing')
    fireEvent.scroll(scrollContainer)

    expect(fetchNextPage).toHaveBeenCalledTimes(shouldFetch ? 1 : 0)
  })

  it('keeps the full logs link available for an empty preview after loading finishes', () => {
    const { rerender } = customRender(
      <ActivityLogs data={[]} isLoading footer={<button>View all logs</button>} />
    )
    expect(screen.queryByRole('button', { name: 'View all logs' })).not.toBeInTheDocument()

    rerender(<ActivityLogs data={[]} footer={<button>View all logs</button>} />)

    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View all logs' })).toBeVisible()
  })
})
