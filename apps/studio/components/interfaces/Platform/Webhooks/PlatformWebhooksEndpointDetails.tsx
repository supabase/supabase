import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { TanStackTableHeadSort } from 'ui-patterns/Table'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { statusBadgeVariant } from './PlatformWebhooksView.utils'
import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface DetailItemProps {
  label: string
  children: ReactNode
  ddClassName?: string
}

const DetailItem = ({ label, children, ddClassName = 'text-sm' }: DetailItemProps) => (
  <div className="space-y-1">
    <dt className="text-sm text-foreground-lighter">{label}</dt>
    <dd className={ddClassName}>{children}</dd>
  </div>
)

interface PlatformWebhooksEndpointDetailsProps {
  deliverySearch: string
  filteredDeliveries: WebhookDelivery[]
  selectedEndpoint: WebhookEndpoint
  onDeliverySearchChange: (value: string) => void
  onOpenDelivery: (deliveryId: string) => void
  onRetryDelivery: (deliveryId: string) => void
}

const DELIVERIES_PAGE_SIZE = 5
const DELIVERY_ACTIONS_COLUMN_ID = 'actions'
const DEFAULT_DELIVERY_SORTING: SortingState = [{ id: 'attemptAt', desc: true }]

const DELIVERY_COLUMNS: ColumnDef<WebhookDelivery>[] = [
  {
    accessorKey: 'status',
    header: ({ column }) => <TanStackTableHeadSort column={column}>Status</TanStackTableHeadSort>,
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: 'eventType',
    header: ({ column }) => (
      <TanStackTableHeadSort column={column}>Event type</TanStackTableHeadSort>
    ),
    cell: ({ row }) => <code className="text-code-inline">{row.original.eventType}</code>,
  },
  {
    accessorKey: 'responseCode',
    header: ({ column }) => <TanStackTableHeadSort column={column}>Response</TanStackTableHeadSort>,
    sortingFn: (rowA, rowB, columnId) => {
      const responseA = rowA.getValue<number | undefined>(columnId) ?? -1
      const responseB = rowB.getValue<number | undefined>(columnId) ?? -1
      return responseA - responseB
    },
    cell: ({ row }) =>
      row.original.responseCode != null ? (
        <DataTableColumnStatusCode
          value={row.original.responseCode}
          level={getStatusLevel(row.original.responseCode)}
          className="text-xs"
        />
      ) : (
        <span className="text-xs text-foreground-muted">–</span>
      ),
  },
  {
    accessorKey: 'attemptAt',
    header: ({ column }) => (
      <TanStackTableHeadSort column={column}>Attempted</TanStackTableHeadSort>
    ),
    cell: ({ row }) => (
      <TimestampInfo
        className="text-sm text-foreground-lighter"
        utcTimestamp={row.original.attemptAt}
      />
    ),
  },
  {
    id: DELIVERY_ACTIONS_COLUMN_ID,
    enableSorting: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const { onRetryDelivery } = table.options.meta as {
        onRetryDelivery: (deliveryId: string) => void
      }

      return (
        <div className="flex h-full items-center justify-end">
          {row.original.status !== 'success' ? (
            <ButtonTooltip
              type="default"
              size="tiny"
              className="w-7 shrink-0 hit-area-2"
              icon={<RotateCcw />}
              aria-label={`Retry ${row.original.id}`}
              tooltip={{ content: { side: 'top', text: 'Retry' } }}
              onClick={(event) => {
                event.stopPropagation()
                onRetryDelivery(row.original.id)
              }}
              onKeyDown={(event) => event.stopPropagation()}
            />
          ) : (
            <Button
              type="default"
              size="tiny"
              className="w-7 shrink-0 hit-area-2 invisible pointer-events-none"
              icon={<RotateCcw />}
              aria-hidden
              tabIndex={-1}
            />
          )}
        </div>
      )
    },
  },
]

export const PlatformWebhooksEndpointDetails = ({
  deliverySearch,
  filteredDeliveries,
  selectedEndpoint,
  onDeliverySearchChange,
  onOpenDelivery,
  onRetryDelivery,
}: PlatformWebhooksEndpointDetailsProps) => {
  const hasCustomHeaders = selectedEndpoint.customHeaders.length > 0
  const hasName = selectedEndpoint.name.trim().length > 0
  const hasDescription = selectedEndpoint.description.trim().length > 0
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_DELIVERY_SORTING)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DELIVERIES_PAGE_SIZE,
  })

  const table = useReactTable({
    data: filteredDeliveries,
    columns: DELIVERY_COLUMNS,
    state: { pagination, sorting },
    meta: { onRetryDelivery },
    getRowId: (row) => row.id,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const paginatedDeliveries = table.getRowModel().rows
  const deliveryStartIndex =
    table.getState().pagination.pageIndex * table.getState().pagination.pageSize
  const deliveryRangeStart = filteredDeliveries.length === 0 ? 0 : deliveryStartIndex + 1
  const deliveryRangeEnd = Math.min(
    deliveryStartIndex + table.getState().pagination.pageSize,
    filteredDeliveries.length
  )

  useEffect(() => {
    setPagination((currentPagination) => ({ ...currentPagination, pageIndex: 0 }))
  }, [deliverySearch, selectedEndpoint.id])

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Overview</h2>
        <Card className="overflow-hidden">
          <CardContent className="pb-5">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              {hasName && <DetailItem label="Name">{selectedEndpoint.name}</DetailItem>}

              <DetailItem label="URL" ddClassName="text-sm break-all">
                {selectedEndpoint.url}
              </DetailItem>

              {hasDescription && (
                <DetailItem label="Description">{selectedEndpoint.description}</DetailItem>
              )}

              <DetailItem label="Event types" ddClassName="flex flex-wrap gap-2">
                {(selectedEndpoint.eventTypes.includes('*')
                  ? ['All events (*)']
                  : selectedEndpoint.eventTypes
                ).map((eventType) => (
                  <code
                    key={eventType}
                    className="text-code-inline rounded-md border px-3 py-1.5 text-2xs"
                  >
                    {eventType}
                  </code>
                ))}
              </DetailItem>

              {hasCustomHeaders && (
                <DetailItem label="Custom headers">
                  <div className="rounded-md border divide-y divide-border">
                    {selectedEndpoint.customHeaders.map((header) => (
                      <div
                        key={header.id}
                        className="px-2 py-2 font-mono font-medium text-xs flex items-center gap-2 flex-wrap"
                      >
                        <code className="text-code_block-4">{header.key}:</code>
                        <code>{header.value}</code>
                      </div>
                    ))}
                  </div>
                </DetailItem>
              )}

              <DetailItem label="Created by">{selectedEndpoint.createdBy}</DetailItem>

              <DetailItem label="Created at">
                <TimestampInfo className="text-sm" utcTimestamp={selectedEndpoint.createdAt} />
              </DetailItem>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Deliveries</h2>
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search deliveries"
            size="tiny"
            icon={<Search />}
            value={deliverySearch}
            className="w-full lg:w-52"
            onChange={(event) => onDeliverySearchChange(event.target.value)}
          />
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnId = header.column.id
                    const sort = header.column.getIsSorted()

                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          header.column.getCanSort()
                            ? sort === 'asc'
                              ? 'ascending'
                              : sort === 'desc'
                                ? 'descending'
                                : 'none'
                            : undefined
                        }
                        className={columnId === DELIVERY_ACTIONS_COLUMN_ID ? 'w-1' : ''}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {paginatedDeliveries.length > 0 ? (
                paginatedDeliveries.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer inset-focus"
                    onClick={() => onOpenDelivery(row.original.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenDelivery(row.original.id)
                      }
                    }}
                    tabIndex={0}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === DELIVERY_ACTIONS_COLUMN_ID ? 'w-1 text-right' : ''
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={DELIVERY_COLUMNS.length}>
                    <p className="text-sm text-foreground">No deliveries found</p>
                    <p className="text-sm text-foreground-lighter">
                      Try adjusting your search to see more webhook attempts.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredDeliveries.length > 0 && (
            <CardFooter className="border-t p-4 flex items-center justify-between">
              <p className="text-foreground-muted text-sm">
                Showing {deliveryRangeStart} to {deliveryRangeEnd} of {filteredDeliveries.length}{' '}
                deliveries
              </p>
              <div className="flex items-center gap-x-2" aria-label="Pagination">
                <Button
                  icon={<ChevronLeft />}
                  className="w-7 hit-area-2"
                  aria-label="Previous page"
                  type="default"
                  size="tiny"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                />
                <Button
                  icon={<ChevronRight />}
                  className="w-7 hit-area-2"
                  aria-label="Next page"
                  type="default"
                  size="tiny"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                />
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
