import type { ColumnDef } from '@tanstack/react-table'
import { Bolt } from 'lucide-react'

import { TextWithTooltip } from 'components/interfaces/DataTableDemo/components/custom/text-with-tooltip'
import { DataTableColumnHeader } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column-header'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import { HoverCardTimestamp } from 'components/interfaces/DataTableDemo/infinite/_components/hover-card-timestamp'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { AuthUserHoverCard } from './components/auth-user-hover-card'
import { LogTypeIcon } from './LogTypeIcon'
import type { ColumnSchema } from './UnifiedLogs.schema'

// Event broadcaster for selecting the trace tab
// This will be used to communicate between the columns and the client component
export const logEventBus = {
  listeners: new Map<string, Set<(...args: any[]) => void>>(),

  on(event: 'selectTraceTab', callback: (rowId: string) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  },

  emit(event: 'selectTraceTab', rowId: string) {
    this.listeners.get(event)?.forEach((callback) => callback(rowId))
  },
}

export const columns: ColumnDef<ColumnSchema>[] = [
  {
    accessorKey: 'level',
    header: '',
    cell: ({ row }) => {
      const level = row.getValue<ColumnSchema['level']>('level')
      return <DataTableColumnLevelIndicator value={level} />
    },
    enableHiding: false,
    enableResizing: false,
    filterFn: (row, columnId, filterValue) => true,
    size: 48,
    minSize: 48,
    maxSize: 48,
    meta: {
      headerClassName:
        'w-[--header-level-size] max-w-[--header-level-size] min-w-[--header-level-size]',
      cellClassName: 'w-[--col-level-size] max-w-[--col-level-size] min-w-[--col-level-size]',
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue<ColumnSchema['date']>('date'))
      return <HoverCardTimestamp date={date} />
    },
    filterFn: (row, columnId, filterValue) => true,
    enableResizing: false,
    size: 190,
    minSize: 190,
    maxSize: 190,
    meta: {
      headerClassName:
        'w-[--header-date-size] max-w-[--header-date-size] min-w-[--header-date-size]',
      cellClassName:
        'font-mono w-[--col-date-size] max-w-[--col-date-size] min-w-[--col-date-size]',
    },
  },
  {
    accessorKey: 'log_type',
    header: '',
    cell: ({ row }) => {
      const logType = row.getValue<ColumnSchema['log_type']>('log_type')
      return (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-right flex items-center gap-1">
          {row.original.has_trace && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Bolt
                  className="text-foreground/30 cursor-pointer hover:text-foreground/70"
                  size={12}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent row selection
                    logEventBus.emit('selectTraceTab', row.original.uuid)
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>View trace details</TooltipContent>
            </Tooltip>
          )}
          <LogTypeIcon type={logType} size={16} className="text-foreground/70" />
        </div>
      )
    },
    enableHiding: false,
    filterFn: (row, columnId, filterValue) => true,
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableResizing: false,
    meta: {
      headerClassName:
        'w-[--header-log_type-size] max-w-[--header-log_type-size] min-w-[--header-log_type-size]',
      cellClassName:
        'text-right px-0 relative justify-end items-center font-mono w-[--col-log_type-size] max-w-[--col-log_type-size] min-w-[--col-log_type-size]',
    },
  },
  {
    // TODO: make it a type of MethodSchema!
    accessorKey: 'method',
    header: 'Method',
    filterFn: 'arrIncludesSome',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['method']>('method')
      return <span className="text-foreground-lighter">{value}</span>
    },
    enableResizing: false,
    size: 69,
    minSize: 69,
    meta: {
      cellClassName:
        'font-mono text-muted-foreground w-[--col-method-size] max-w-[--col-method-size] min-w-[--col-method-size]',
      headerClassName:
        'w-[--header-method-size] max-w-[--header-method-size] min-w-[--header-method-size]',
    },
  },
  {
    accessorKey: 'status',
    header: '',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['status']>('status')
      return (
        <div className="flex items-center gap-1">
          {row.original.auth_user && (
            <div>
              <AuthUserHoverCard authUser={row.original.auth_user} />
            </div>
          )}
          <DataTableColumnStatusCode
            value={value}
            level={row.getValue<ColumnSchema['level']>('level')}
          />
        </div>
      )
    },
    filterFn: (row, columnId, filterValue) => true,
    enableResizing: false,
    size: 60,
    minSize: 60,
    meta: {
      headerClassName:
        'w-[--header-status-size] max-w-[--header-status-size] min-w-[--header-status-size]',
      cellClassName:
        'font-mono w-[--col-status-size] max-w-[--col-status-size] min-w-[--col-status-size]',
    },
  },

  {
    accessorKey: 'host',
    header: 'Host',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['host']>('host')
      return <TextWithTooltip text={value} />
    },
    size: 220,
    minSize: 220,
    meta: {
      cellClassName: 'font-mono w-[--col-host-size] max-w-[--col-host-size]',
      headerClassName: 'min-w-[--header-host-size] w-[--header-host-size]',
    },
  },
  {
    accessorKey: 'pathname',
    header: 'Pathname',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['pathname']>('pathname')
      return <TextWithTooltip text={value} />
    },
    size: 320,
    minSize: 320,
    meta: {
      cellClassName: 'font-mono w-[--col-pathname-size] max-w-[--col-pathname-size]',
      headerClassName: 'min-w-[--header-pathname-size] w-[--header-pathname-size]',
    },
  },
  {
    accessorKey: 'event_message',
    header: ({ column }) => <DataTableColumnHeader column={column} title="event_message" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['event_message']>('event_message')
      const logCount = row.original.log_count

      return (
        <div className="flex flex-row gap-2 items-center">
          {logCount && (
            <Tooltip>
              <TooltipTrigger>
                <span className="text-foreground-lighter bg-surface-400 px-[6px] py-[2px] h-fit rounded-md text-[0.8rem] leading-none">
                  {logCount}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {logCount} {logCount === 1 ? 'log' : 'logs'} for this execution
              </TooltipContent>
            </Tooltip>
          )}
          {value && (
            <span className="text-muted-foreground">
              <TextWithTooltip text={value} />
            </span>
          )}
        </div>
      )
    },
    enableResizing: true,
    size: 400,
    minSize: 400,
    meta: {
      headerClassName:
        'w-[--header-event_message-size] max-w-[--header-event_message-size] min-w-[--header-event_message-size]',
      cellClassName:
        'font-mono w-[--col-event_message-size] max-w-[--col-event_message-size] min-w-[--col-event_message-size]',
    },
  },
]
