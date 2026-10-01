import { flexRender, type Table as TanStackTable } from '@tanstack/react-table'
import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { formatCompactNumber } from '@/components/ui/DataTable/DataTable.utils'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

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
  const rows = table.getRowModel().rows

  return (
    <Table
      className="table-fixed"
      containerProps={{
        containerClassName: 'h-full',
        className: 'h-full w-full overflow-auto @container',
      }}
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
      <TableBody>
        {rows.map((row) => (
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
        ))}
        {rows.length > 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={table.getAllLeafColumns().length} className="p-0! overflow-visible">
              <div className="sticky left-0 w-[100cqw] py-2 text-center">
                <p className="text-xs text-foreground-lighter">
                  Viewing{' '}
                  <span className="font-mono font-medium">{formatCompactNumber(rows.length)}</span>{' '}
                  logs
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
