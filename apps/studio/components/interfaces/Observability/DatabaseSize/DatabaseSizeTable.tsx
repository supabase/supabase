import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ui'
import { TanStackTableHeadSort } from 'ui-patterns/Table'

import {
  getSizeRows,
  relationSize,
  sizePercentage,
  type SizeRow,
  type SizeView,
} from './DatabaseSize.utils'
import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'
import { formatBytes } from '@/lib/helpers'
import { onSearchInputEscape } from '@/lib/keyboard'

const getAriaSort = (sort: false | 'asc' | 'desc') => {
  if (sort === 'asc') return 'ascending'
  if (sort === 'desc') return 'descending'
  return 'none'
}

const views: { value: SizeView; label: string }[] = [
  { value: 'all', label: 'All objects' },
  { value: 'tables', label: 'Tables' },
  { value: 'indexes', label: 'Indexes' },
  { value: 'toast', label: 'TOAST' },
  { value: 'schemas', label: 'Schemas' },
]

const getColumns = (total: number): ColumnDef<SizeRow>[] => [
  ...(
    [
      ['name', 'Object'],
      ['schema', 'Schema'],
      ['type', 'Type'],
      ['size', 'Size'],
      ['table', 'Table size'],
      ['index', 'Index size'],
      ['toast', 'TOAST size'],
    ] as const
  ).map(([key, label]) => ({
    accessorKey: key,
    header: ({ column }: { column: import('@tanstack/react-table').Column<SizeRow> }) => (
      <TanStackTableHeadSort column={column}>{label}</TanStackTableHeadSort>
    ),
    cell: ({ row }: { row: import('@tanstack/react-table').Row<SizeRow> }) => {
      const value = row.original[key]
      return typeof value === 'number' ? formatBytes(value) : value
    },
  })),
  {
    id: 'percentage',
    header: '% of objects',
    cell: ({ row }) => sizePercentage(row.original.size, total),
  },
]

export function DatabaseSizeTable({ relations }: { relations: DatabaseSizeRelation[] }) {
  const [view, setView] = useState<SizeView>('all')
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'size', desc: true }])
  const total = relations.reduce((sum, relation) => sum + relationSize(relation, 'total'), 0)
  const columns = useMemo(() => getColumns(total), [total])
  const rows = useMemo(() => getSizeRows(relations, view), [relations, view])
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    getRowId: (row) => row.id,
  })

  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        const next = views.find((item) => item.value === value)
        if (next) {
          setView(next.value)
          table.setPageIndex(0)
        }
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="flex-wrap h-auto">
          {views.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Input
          aria-label="Search objects"
          placeholder="Search objects..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            table.setPageIndex(0)
          }}
          onKeyDown={onSearchInputEscape(search, setSearch)}
          className="w-full sm:w-64"
        />
      </div>
      <TabsContent value={view} className="space-y-3">
        <p className="text-xs text-foreground-light">
          {view === 'all'
            ? 'Each object is counted once. Table rows exclude indexes and TOAST; TOAST includes its own indexes.'
            : 'Table and schema totals include their indexes and TOAST. Percentages use the total size of listed database objects.'}
        </p>
        <div className="overflow-x-auto rounded border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id} aria-sort={getAriaSort(header.column.getIsSorted())}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-foreground-light"
                  >
                    No matching objects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-xs text-foreground-light">
          <span>{table.getFilteredRowModel().rows.length} objects</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
