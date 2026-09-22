import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { fireEvent, screen } from '@testing-library/react'
import { memo, useState } from 'react'
import { Button } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { DataTableFilterField } from '../DataTable.types'
import { DataTableProvider, useDataTable } from './DataTableProvider'
import { customRender } from '@/tests/lib/custom-render'

const data = [{ id: 'first', message: 'First log' }]
const columns = [{ accessorKey: 'message' }]
const filterFields: DataTableFilterField<(typeof data)[number]>[] = []

const TableControls = memo(function TableControls({ onRender }: { onRender: () => void }) {
  const { table } = useDataTable()
  onRender()
  return (
    <Button onClick={() => table.getColumn('message')?.toggleVisibility()}>
      {table.getColumn('message')?.getIsVisible() ? 'Hide message' : 'Show message'}
    </Button>
  )
})

function Harness({ onRender }: { onRender: () => void }) {
  const [openRowId, setOpenRowId] = useState<string>()
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  return (
    <DataTableProvider
      table={table}
      columns={columns}
      filterFields={filterFields}
      columnVisibility={table.getState().columnVisibility}
      error={null}
      isError={false}
      isLoading={false}
      isFetching={false}
      isLoadingCounts={false}
      openRowId={openRowId}
      setOpenRowId={setOpenRowId}
    >
      <Button onClick={() => setOpenRowId('first')}>Select log</Button>
      <TableControls onRender={onRender} />
    </DataTableProvider>
  )
}

describe('table context subscriptions', () => {
  it('keeps table controls unchanged on selection but updates them for column visibility', () => {
    const onRender = vi.fn()
    customRender(<Harness onRender={onRender} />)
    onRender.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Select log' }))
    expect(onRender).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Hide message' }))
    expect(screen.getByRole('button', { name: 'Show message' })).toBeVisible()
    expect(onRender).toHaveBeenCalledOnce()
  })
})
