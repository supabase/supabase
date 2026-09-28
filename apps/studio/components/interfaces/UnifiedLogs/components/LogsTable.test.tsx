import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LogsTable } from './LogsTable'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { customRender } from '@/tests/lib/custom-render'

// Any log-like rows can use the logs table, not just unified logs rows
type ActivityLog = { request_id: string; action: string }

const rows: ActivityLog[] = [
  { request_id: 'req-1', action: 'Created project' },
  { request_id: 'req-2', action: 'Paused project' },
]
const columns: ColumnDef<ActivityLog>[] = [{ accessorKey: 'action', header: 'Event' }]

const ActivityLogs = ({ onSelectRow }: { onSelectRow: (id: string) => void }) => {
  const table = useReactTable({
    data: rows,
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
      isLoading={false}
      isFetching={false}
      isLoadingCounts={false}
      onSelectRow={onSelectRow}
    >
      <LogsTable
        columns={columns}
        fetchNextPage={vi.fn()}
        setColumnOrder={vi.fn()}
        setColumnVisibility={vi.fn()}
        footer={<p>Viewing 2 logs</p>}
      />
    </DataTableProvider>
  )
}

describe('LogsTable', () => {
  it('renders any row type with its own columns and footer', () => {
    const onSelectRow = vi.fn()
    customRender(<ActivityLogs onSelectRow={onSelectRow} />)

    const table = within(screen.getByRole('table'))
    expect(table.getByText('Event')).toBeInTheDocument()
    expect(table.getByText('Viewing 2 logs')).toBeInTheDocument()

    fireEvent.click(table.getByText('Paused project'))
    expect(onSelectRow).toHaveBeenCalledWith('req-2', expect.anything())
  })
})
