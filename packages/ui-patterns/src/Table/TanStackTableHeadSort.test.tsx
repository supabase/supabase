import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { describe, expect, it } from 'vitest'

import { TanStackTableHeadSort } from './TanStackTableHeadSort'

type Row = {
  name: string
  amount: number
}

const data: Row[] = [
  { name: 'Bravo', amount: 200 },
  { name: 'Alpha', amount: 100 },
]

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <TanStackTableHeadSort column={column}>Name</TanStackTableHeadSort>,
    cell: ({ row }) => row.getValue('name'),
  },
  {
    accessorKey: 'amount',
    enableSorting: false,
    header: ({ column }) => <TanStackTableHeadSort column={column}>Amount</TanStackTableHeadSort>,
    cell: ({ row }) => row.getValue('amount'),
  },
]

const classNameColumns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <TanStackTableHeadSort column={column} className="justify-end">
        Name
      </TanStackTableHeadSort>
    ),
    cell: ({ row }) => row.getValue('name'),
  },
]

const TestTable = ({ tableColumns = columns }: { tableColumns?: ColumnDef<Row>[] }) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

describe('TanStackTableHeadSort', () => {
  it('cycles unsorted, ascending, descending, and cleared', async () => {
    const user = userEvent.setup()

    render(<TestTable />)

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bravo')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alpha')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bravo')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bravo')
  })

  it('renders non-sortable columns as plain content', () => {
    render(<TestTable />)

    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Amount' })).not.toBeInTheDocument()
  })

  it('passes className through to the rendered sort control', () => {
    render(<TestTable tableColumns={classNameColumns} />)

    expect(screen.getByRole('button', { name: 'Name' })).toHaveClass('justify-end')
  })
})
