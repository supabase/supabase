'use client'

import { TextWithTooltip } from 'components/interfaces/DataTableDemo/components/custom/text-with-tooltip'
import { DataTableColumnHeader } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column-header'
import { DataTableColumnLatency } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-latency'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { DataTableColumnRegion } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-region'
import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from 'ui'
import {
  getTimingColor,
  getTimingLabel,
  getTimingPercentage,
  timingPhases,
} from 'components/interfaces/DataTableDemo/lib/request/timing'
import { cn } from 'ui'
import { HoverCardPortal } from '@radix-ui/react-hover-card'
import type { ColumnDef } from '@tanstack/react-table'
import { Minus } from 'lucide-react'
import { HoverCardTimestamp } from 'components/interfaces/DataTableDemo/infinite/_components/hover-card-timestamp'

// custom imports
import type { ColumnSchema } from './schema'
import { LogTypeIcon } from './LogTypeIcon'

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
    // filterFn: 'arrSome',
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
    filterFn: 'inDateRange',
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
  // {
  //   accessorKey: 'id',
  //   header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
  //   cell: ({ row }) => {
  //     const value = row.getValue<ColumnSchema['id']>('id')
  //     return <TextWithTooltip text={value} />
  //   },
  //   size: 130,
  //   minSize: 130,
  //   meta: {
  //     headerClassName: 'w-[--header-id-size] max-w-[--header-id-size] min-w-[--header-id-size]',
  //     cellClassName: 'w-[--col-id-size] max-w-[--col-id-size] min-w-[--col-id-size]',
  //   },
  // },
  // {
  //   id: 'uuid',
  //   accessorKey: 'uuid',
  //   header: 'Request Id',
  //   cell: ({ row }) => {
  //     const value = row.getValue<ColumnSchema['uuid']>('uuid')
  //     return <TextWithTooltip text={value} />
  //   },
  //   enableResizing: false,
  //   size: 130,
  //   minSize: 130,
  //   meta: {
  //     label: 'Request Id',
  //     cellClassName:
  //       'font-mono w-[--col-uuid-size] max-w-[--col-uuid-size] min-w-[--col-uuid-size]',
  //     headerClassName:
  //       'min-w-[--header-uuid-size] w-[--header-uuid-size] max-w-[--header-uuid-size]',
  //   },
  // },
  {
    accessorKey: 'log_type',
    header: '',
    cell: ({ row }) => {
      const logType = row.getValue<ColumnSchema['log_type']>('log_type')
      return (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-right">
          <LogTypeIcon type={logType} size={16} className="text-foreground/70" />
        </div>
      )
    },
    enableHiding: false,
    filterFn: 'arrSome',
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
        <DataTableColumnStatusCode
          value={value}
          level={row.getValue<ColumnSchema['level']>('level')}
        />
      )
    },
    filterFn: 'arrSome',
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
  // {
  //   accessorKey: 'latency',
  //   // TODO: check if we can right align the table header/cell (makes is easier to read)
  //   header: ({ column }) => <DataTableColumnHeader column={column} title="Latency" />,
  //   cell: ({ row }) => {
  //     const value = row.getValue<ColumnSchema['latency']>('latency')
  //     return <DataTableColumnLatency value={value} />
  //   },
  //   filterFn: 'inNumberRange',
  //   enableResizing: false,
  //   size: 110,
  //   minSize: 110,
  //   meta: {
  //     headerClassName:
  //       'w-[--header-latency-size] max-w-[--header-latency-size] min-w-[--header-latency-size]',
  //     cellClassName:
  //       'font-mono w-[--col-latency-size] max-w-[--col-latency-size] min-w-[--col-latency-size]',
  //   },
  // },
  // {
  //   accessorKey: 'regions',
  //   header: 'Region',
  //   cell: ({ row }) => {
  //     const value = row.getValue<ColumnSchema['regions']>('regions')
  //     if (Array.isArray(value)) {
  //       if (value.length > 1) {
  //         return <div className="text-muted-foreground">{value.join(', ')}</div>
  //       } else {
  //         return (
  //           <div className="whitespace-nowrap">
  //             <DataTableColumnRegion value={value[0]} />
  //           </div>
  //         )
  //       }
  //     }
  //     if (typeof value === 'string') {
  //       return <DataTableColumnRegion value={value} />
  //     }
  //     return <Minus className="h-4 w-4 text-muted-foreground/50" />
  //   },
  //   filterFn: 'arrIncludesSome',
  //   enableResizing: false,
  //   size: 163,
  //   minSize: 163,
  //   meta: {
  //     headerClassName:
  //       'w-[--header-regions-size] max-w-[--header-regions-size] min-w-[--header-regions-size]',
  //     cellClassName:
  //       'font-mono w-[--col-regions-size] max-w-[--col-regions-size] min-w-[--col-regions-size]',
  //   },
  // },
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
    enableResizing: true, // allow manual resizing
    size: 400,
    minSize: 400,
    // ❌ don't set maxSize — let it grow
    meta: {
      headerClassName:
        'w-[--header-event_message-size] max-w-[--header-event_message-size] min-w-[--header-event_message-size]',
      cellClassName:
        'font-mono w-[--col-event_message-size] max-w-[--col-event_message-size] min-w-[--col-event_message-size]',
    },
  },
]
