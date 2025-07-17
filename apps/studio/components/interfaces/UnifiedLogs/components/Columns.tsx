import { ColumnDef } from '@tanstack/react-table'

import { DataTableColumnHeader } from 'components/ui/DataTable/DataTableColumn/DataTableColumnHeader'
import { DataTableColumnLevelIndicator } from 'components/ui/DataTable/DataTableColumn/DataTableColumnLevelIndicator'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ColumnFilterSchema, ColumnSchema } from '../UnifiedLogs.schema'
import { AuthUserHoverCard } from './AuthUserHoverCard'
import { HoverCardTimestamp } from './HoverCardTimestamp'
import { LogTypeIcon } from './LogTypeIcon'
import { TextWithTooltip } from './TextWithTooltip'

// Check if column should be hidden when all values are empty
function shouldHideColumn(data: ColumnSchema[], columnKey: keyof ColumnSchema): boolean {
  if (!data || data.length === 0) return false

  return data.every((row) => {
    const value = row[columnKey]
    return !value || value === '' || value === null || value === undefined
  })
}

// Generate dynamic columns based on data
export function generateDynamicColumns(data: ColumnSchema[]): ColumnDef<ColumnSchema>[] {
  const hideMethod = shouldHideColumn(data, 'method')
  const hidePathname = shouldHideColumn(data, 'pathname')
  const hideEventMessage = shouldHideColumn(data, 'event_message')

  const columns: ColumnDef<ColumnSchema>[] = [
    // Level column - always visible
    {
      accessorKey: 'level',
      header: '',
      cell: ({ row }) => {
        const level = row.getValue<ColumnSchema['level']>('level')
        return <DataTableColumnLevelIndicator value={level} />
      },
      enableHiding: false,
      enableResizing: false,
      enableSorting: false,
      filterFn: (row, columnId, filterValue) => true,
      size: 48,
      minSize: 48,
      maxSize: 48,
    },
    // Date column - always visible
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue<ColumnSchema['date']>('date'))
        return <HoverCardTimestamp date={date} />
      },
      filterFn: (row, columnId, filterValue) => true,
      enableResizing: false,
      enableSorting: false,
      size: 130,
      minSize: 130,
      maxSize: 130,
      meta: {
        cellClassName: 'font-mono',
      },
    },
    // Log type column - always visible
    {
      accessorKey: 'log_type',
      header: '',
      cell: ({ row }) => {
        const logType = row.getValue<ColumnSchema['log_type']>('log_type')
        return (
          <div className="flex items-center justify-end gap-1">
            <LogTypeIcon type={logType} size={16} className="text-foreground/70" />
          </div>
        )
      },
      enableHiding: false,
      filterFn: (row, columnId, filterValue) => true,
      enableResizing: false,
      enableSorting: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
    },
    // Status column - always visible
    {
      accessorKey: 'status',
      header: '',
      cell: ({ row }) => {
        const value = row.getValue<ColumnSchema['status']>('status')
        return (
          <div className="flex items-center gap-1">
            {/* {row.original.auth_user && (
            // to do: add auth user hover card
              <div>
                <AuthUserHoverCard authUser={row.original.auth_user} />
              </div>
            )} */}
            <DataTableColumnStatusCode
              value={value}
              level={row.getValue<ColumnSchema['level']>('level')}
            />
          </div>
        )
      },
      filterFn: (row, columnId, filterValue) => true,
      enableResizing: false,
      enableSorting: false,
      size: 70,
      minSize: 70,
      maxSize: 70,
    },
  ]

  // Method column - hide if all values are empty
  if (!hideMethod) {
    columns.push({
      accessorKey: 'method',
      header: 'Method',
      filterFn: 'arrIncludesSome',
      cell: ({ row }) => {
        const value = row.getValue<ColumnSchema['method']>('method')
        return <span className="text-foreground-lighter">{value}</span>
      },
      enableResizing: false,
      enableSorting: false,
      size: 70,
      minSize: 70,
      maxSize: 70,
    })
  }

  // Pathname column - hide if all values are empty
  if (!hidePathname) {
    columns.push({
      accessorKey: 'pathname',
      header: 'Pathname',
      cell: ({ row }) => {
        const value = row.getValue<ColumnFilterSchema['pathname']>('pathname') ?? ''
        return <TextWithTooltip text={value} />
      },
      enableSorting: false,
      enableResizing: false,
      size: 200,
      minSize: 200,
      maxSize: 200,
      meta: {
        cellClassName: 'max-w-[320px]',
        headerClassName: 'max-w-[320px]',
      },
    })
  }

  // Event message column - hide if all values are empty
  if (!hideEventMessage) {
    columns.push({
      accessorKey: 'event_message',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Event message" />,
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
      enableSorting: false,
      size: 400,
      minSize: 400,
      maxSize: 400,
    })
  }

  return columns
}

// Static fallback columns
export const UNIFIED_LOGS_COLUMNS: ColumnDef<ColumnSchema>[] = generateDynamicColumns([])
