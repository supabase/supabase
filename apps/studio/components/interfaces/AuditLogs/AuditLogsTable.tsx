import { flexRender, type Table as TanStackTable } from '@tanstack/react-table'
import { useRef } from 'react'
import { cn, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { formatCompactNumber } from '@/components/ui/DataTable/DataTable.utils'
import { VirtualizedTable, VirtualizedTableBody } from '@/components/ui/VirtualizedTable'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

// py-2 padding + text-xs line height; rows are re-measured after mount
const ESTIMATED_ROW_HEIGHT = 41

interface AuditLogColumnMeta {
  cellClassName?: string
  headerClassName?: string
}

interface AuditLogsTableProps {
  table: TanStackTable<AuditLog>
  selectedLog?: AuditLog
  onSelectLog: (log: AuditLog) => void
}

export const AuditLogsTable = ({ table, selectedLog, onSelectLog }: AuditLogsTableProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  return (
    <VirtualizedTable
      data={rows}
      className="table-fixed"
      estimateSize={() => ESTIMATED_ROW_HEIGHT}
      getItemKey={(row) => row.id}
      scrollContainerRef={scrollContainerRef}
      scrollContainerProps={{ className: '@container' }}
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b-0! hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={cn(
                  'sticky top-0 z-10 bg-surface-100',
                  '[border-bottom:none]! [box-shadow:inset_0_-1px_0_var(--border-default)]!',
                  (header.column.columnDef.meta as AuditLogColumnMeta | undefined)?.headerClassName,
                  'px-2 first:pl-3'
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <VirtualizedTableBody<(typeof rows)[number]>
        paddingColSpan={table.getAllLeafColumns().length}
        trailingContent={
          rows.length > 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="p-0! overflow-visible"
              >
                <div className="sticky left-0 w-[100cqw] py-2 text-center">
                  <p className="text-xs text-foreground-lighter">
                    Viewing{' '}
                    <span className="font-mono font-medium">
                      {formatCompactNumber(rows.length)}
                    </span>{' '}
                    logs
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : undefined
        }
      >
        {(row) => (
          <TableRow
            key={row.id}
            tabIndex={0}
            aria-selected={selectedLog?.request_id === row.original.request_id}
            onClick={() => onSelectLog(row.original)}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return
              if (e.key === 'Enter') {
                onSelectLog(row.original)
              } else if (e.key === ' ') {
                e.preventDefault()
                onSelectLog(row.original)
              }
            }}
            className={cn(
              'cursor-pointer hover:bg-selection!',
              selectedLog?.request_id === row.original.request_id && 'bg-selection!'
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(
                  'py-2 px-2 text-xs first:pl-3',
                  (cell.column.columnDef.meta as AuditLogColumnMeta | undefined)?.cellClassName
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}
