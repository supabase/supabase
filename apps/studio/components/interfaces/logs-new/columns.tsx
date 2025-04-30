'use client'

import { TextWithTooltip } from 'components/interfaces/DataTableDemo/components/custom/text-with-tooltip'
import { DataTableColumnHeader } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column-header'
import { DataTableColumnLatency } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-latency'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { DataTableColumnRegion } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-region'
import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
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
    filterFn: 'arrSome',
    size: 27,
    minSize: 27,
    maxSize: 27,
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
    size: 200,
    minSize: 200,
    meta: {
      headerClassName:
        'w-[--header-date-size] max-w-[--header-date-size] min-w-[--header-date-size]',
      cellClassName:
        'font-mono w-[--col-date-size] max-w-[--col-date-size] min-w-[--col-date-size]',
    },
  },
  {
    id: 'uuid',
    accessorKey: 'uuid',
    header: 'Request Id',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['uuid']>('uuid')
      return <TextWithTooltip text={value} />
    },
    size: 130,
    minSize: 130,
    meta: {
      label: 'Request Id',
      cellClassName:
        'font-mono w-[--col-uuid-size] max-w-[--col-uuid-size] min-w-[--col-uuid-size]',
      headerClassName:
        'min-w-[--header-uuid-size] w-[--header-uuid-size] max-w-[--header-uuid-size]',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['status']>('status')
      return <DataTableColumnStatusCode value={value} />
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
    // TODO: make it a type of MethodSchema!
    accessorKey: 'method',
    header: 'Method',
    filterFn: 'arrIncludesSome',
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
    accessorKey: 'host',
    header: 'Host',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['host']>('host')
      return <TextWithTooltip text={value} />
    },
    size: 125,
    minSize: 125,
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
    size: 130,
    minSize: 130,
    meta: {
      cellClassName: 'font-mono w-[--col-pathname-size] max-w-[--col-pathname-size]',
      headerClassName: 'min-w-[--header-pathname-size] w-[--header-pathname-size]',
    },
  },
  {
    accessorKey: 'latency',
    // TODO: check if we can right align the table header/cell (makes is easier to read)
    header: ({ column }) => <DataTableColumnHeader column={column} title="Latency" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['latency']>('latency')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      headerClassName:
        'w-[--header-latency-size] max-w-[--header-latency-size] min-w-[--header-latency-size]',
      cellClassName:
        'font-mono w-[--col-latency-size] max-w-[--col-latency-size] min-w-[--col-latency-size]',
    },
  },
  {
    accessorKey: 'regions',
    header: 'Region',
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['regions']>('regions')
      if (Array.isArray(value)) {
        if (value.length > 1) {
          return <div className="text-muted-foreground">{value.join(', ')}</div>
        } else {
          return (
            <div className="whitespace-nowrap">
              <DataTableColumnRegion value={value[0]} />
            </div>
          )
        }
      }
      if (typeof value === 'string') {
        return <DataTableColumnRegion value={value} />
      }
      return <Minus className="h-4 w-4 text-muted-foreground/50" />
    },
    filterFn: 'arrIncludesSome',
    enableResizing: false,
    size: 163,
    minSize: 163,
    meta: {
      headerClassName:
        'w-[--header-regions-size] max-w-[--header-regions-size] min-w-[--header-regions-size]',
      cellClassName:
        'font-mono w-[--col-regions-size] max-w-[--col-regions-size] min-w-[--col-regions-size]',
    },
  },
  {
    accessorKey: 'timing',
    header: () => <div className="whitespace-nowrap">Timing Phases</div>,
    cell: ({ row }) => {
      const timing = {
        'timing.dns': row.getValue<ColumnSchema['timing.dns']>('timing.dns'),
        'timing.connection': row.getValue<ColumnSchema['timing.connection']>('timing.connection'),
        'timing.tls': row.getValue<ColumnSchema['timing.tls']>('timing.tls'),
        'timing.ttfb': row.getValue<ColumnSchema['timing.ttfb']>('timing.ttfb'),
        'timing.transfer': row.getValue<ColumnSchema['timing.transfer']>('timing.transfer'),
      }
      const latency = row.getValue<ColumnSchema['latency']>('latency')
      const percentage = getTimingPercentage(timing, latency)
      // TODO: create a separate component for this in _components
      return (
        <HoverCard openDelay={50} closeDelay={50}>
          <HoverCardTrigger
            className="opacity-70 hover:opacity-100 data-[state=open]:opacity-100"
            asChild
          >
            <div className="flex">
              {Object.entries(timing).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(getTimingColor(key as keyof typeof timing), 'h-4')}
                  style={{ width: `${(value / latency) * 100}%` }}
                />
              ))}
            </div>
          </HoverCardTrigger>
          {/* REMINDER: allows us to port the content to the document.body, which is helpful when using opacity-50 on the row element */}
          <HoverCardPortal>
            <HoverCardContent side="bottom" align="end" className="z-10 w-auto p-2">
              <div className="flex flex-col gap-1">
                {timingPhases.map((phase) => {
                  const color = getTimingColor(phase)
                  const percentageValue = percentage[phase]
                  return (
                    <div key={phase} className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn(color, 'h-2 w-2 rounded-full')} />
                        <div className="font-mono uppercase text-accent-foreground">
                          {getTimingLabel(phase)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-mono text-muted-foreground">{percentageValue}</div>
                        <div className="font-mono">
                          {new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 3,
                          }).format(timing[phase])}
                          <span className="text-muted-foreground">ms</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      )
    },
    enableResizing: false,
    size: 130,
    minSize: 130,
    meta: {
      label: 'Timing Phases',
      headerClassName:
        'w-[--header-timing-size] max-w-[--header-timing-size] min-w-[--header-timing-size]',
      cellClassName:
        'font-mono w-[--col-timing-size] max-w-[--col-timing-size] min-w-[--col-timing-size]',
    },
  },
  {
    id: 'timing.dns',
    accessorFn: (row) => row['timing.dns'],
    header: ({ column }) => <DataTableColumnHeader column={column} title="DNS" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['timing.dns']>('timing.dns')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      label: 'DNS',
      headerClassName:
        'w-[--header-timing-dns-size] max-w-[--header-timing-dns-size] min-w-[--header-timing-dns-size]',
      cellClassName:
        'font-mono w-[--col-timing-dns-size] max-w-[--col-timing-dns-size] min-w-[--col-timing-dns-size]',
    },
  },
  {
    id: 'timing.connection',
    accessorFn: (row) => row['timing.connection'],
    header: ({ column }) => <DataTableColumnHeader column={column} title="Connection" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['timing.connection']>('timing.connection')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      label: 'Connection',
      headerClassName:
        'w-[--header-timing-connection-size] max-w-[--header-timing-connection-size] min-w-[--header-timing-connection-size]',
      cellClassName:
        'font-mono w-[--col-timing-connection-size] max-w-[--col-timing-connection-size] min-w-[--col-timing-connection-size]',
    },
  },
  {
    id: 'timing.tls',
    accessorFn: (row) => row['timing.tls'],
    header: ({ column }) => <DataTableColumnHeader column={column} title="TLS" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['timing.tls']>('timing.tls')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      label: 'TLS',
      headerClassName:
        'w-[--header-timing-tls-size] max-w-[--header-timing-tls-size] min-w-[--header-timing-tls-size]',
      cellClassName:
        'font-mono w-[--col-timing-tls-size] max-w-[--col-timing-tls-size] min-w-[--col-timing-tls-size]',
    },
  },
  {
    id: 'timing.ttfb',
    accessorFn: (row) => row['timing.ttfb'],
    header: ({ column }) => <DataTableColumnHeader column={column} title="TTFB" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['timing.ttfb']>('timing.ttfb')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      label: 'TTFB',
      headerClassName:
        'w-[--header-timing-ttfb-size] max-w-[--header-timing-ttfb-size] min-w-[--header-timing-ttfb-size]',
      cellClassName:
        'font-mono w-[--col-timing-ttfb-size] max-w-[--col-timing-ttfb-size] min-w-[--col-timing-ttfb-size]',
    },
  },
  {
    id: 'timing.transfer',
    accessorFn: (row) => row['timing.transfer'],
    header: ({ column }) => <DataTableColumnHeader column={column} title="Transfer" />,
    cell: ({ row }) => {
      const value = row.getValue<ColumnSchema['timing.transfer']>('timing.transfer')
      return <DataTableColumnLatency value={value} />
    },
    filterFn: 'inNumberRange',
    enableResizing: false,
    size: 110,
    minSize: 110,
    meta: {
      label: 'Transfer',
      headerClassName:
        'w-[--header-timing-transfer-size] max-w-[--header-timing-transfer-size] min-w-[--header-timing-transfer-size]',
      cellClassName:
        'font-mono w-[--col-timing-transfer-size] max-w-[--col-timing-transfer-size] min-w-[--col-timing-transfer-size]',
    },
  },
]
