"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, MoreVertical } from "lucide-react"

import {
  Button,
  Card,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadSort,
  TableHeader,
  TableRow,
} from 'ui'

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "wallace@example.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "wendolene@example.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "piella@example.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "victor@example.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "feathers@example.com",
  },
]

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox_Shadcn_
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox_Shadcn_
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              className="px-1.5"
              icon={<MoreVertical />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-48">            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

type ColumnSort = 'email:asc' | 'email:desc' | 'status:asc' | 'status:desc' | 'amount:asc' | 'amount:desc'

export default function DataTableDemo() {
  const [sort, setSort] = React.useState<ColumnSort | ''>('')
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleSortChange = (column: string) => {
    const [currentCol, currentOrder] = sort.split(':') as [string, 'asc' | 'desc' | '']
    if (currentCol === column) {
      // Cycle through: asc -> desc -> no sort
      if (currentOrder === 'asc') {
        setSort(`${column}:desc` as ColumnSort)
      } else {
        setSort('')
      }
    } else {
      // New column, start with asc
      setSort(`${column}:asc` as ColumnSort)
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sort) return data
    
    const [sortCol, sortOrder] = sort.split(':') as [string, 'asc' | 'desc']
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...data].sort((a, b) => {
      if (sortCol === 'email') {
        return a.email.localeCompare(b.email) * orderMultiplier
      } else if (sortCol === 'status') {
        return a.status.localeCompare(b.status) * orderMultiplier
      } else if (sortCol === 'amount') {
        return (a.amount - b.amount) * orderMultiplier
      }
      return 0
    })
  }, [sort])

  const table = useReactTable({
    data: sortedData,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filters and column visibility controls */}
      <div className="flex items-center">
        <Input
          size="tiny"
          placeholder="Filter by email"
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" className="ml-auto" size="tiny" iconRight={<ChevronDown />}>
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Table */}
      <Card className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id
                  const isSortableColumn = ['email', 'status', 'amount'].includes(columnId)
                  
                  return (
                    <TableHead 
                      key={header.id} 
                      className={
                        columnId === 'amount' 
                          ? 'text-right' 
                          : columnId === 'actions'
                            ? 'w-1'
                            : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : isSortableColumn ? (
                            <TableHeadSort
                              column={columnId}
                              currentSort={sort}
                              onSortChange={handleSortChange}
                              className={columnId === 'amount' ? 'justify-end' : undefined}
                            >
                              {columnId === 'email' ? 'Email' : columnId === 'status' ? 'Status' : 'Amount'}
                            </TableHeadSort>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === 'email'
                          ? 'text-foreground-lighter'
                          : cell.column.id === 'actions'
                            ? 'w-1'
                            : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                
                <TableCell colSpan={columns.length}>
              <p className="text-sm text-foreground">No results found</p>
              <p className="text-sm text-foreground-lighter">
                Your search did not return any results
              </p>
            </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      {/* Count and pagination controls */}
      <div className="flex items-center justify-end space-x-2">
        <div className="text-foreground-muted flex-1 text-xs">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="space-x-2">
          <Button
            type="default"
            size="tiny"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            type="default"
            size="tiny"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
