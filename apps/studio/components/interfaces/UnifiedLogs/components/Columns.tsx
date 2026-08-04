import { ColumnDef } from '@tanstack/react-table'
import { Checkbox, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { STATUS_CODE_LABELS } from '../UnifiedLogs.constants'
import { ColumnFilterSchema, ColumnSchema } from '../UnifiedLogs.schema'
import { getEventMessageDisplay } from '../UnifiedLogs.utils'
import { HoverCardTimestamp } from './HoverCardTimestamp'
import { LogTypeIcon } from './LogTypeIcon'
import { DataTableColumnLevelIndicator } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnLevelIndicator'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

/**
 * Determines if a column should be hidden based on its values in the data.
 * Returns true if all values for the specified columnKey are empty, null, or undefined.
 * Returns false if data is empty or if any value is present.
 *
 * @param data - Array of data rows to check
 * @param columnKey - The key of the column to check for emptiness
 * @returns boolean - true if column should be hidden, false otherwise
 */
function shouldHideColumn(data: ColumnSchema[], columnKey: keyof ColumnSchema): boolean {
  // If there is no data or the data array is empty, do not hide the column
  if (!data || data.length === 0) return false

  // Check if every row has an empty, null, or undefined value for the given columnKey
  return data.every((row) => {
    const value = row[columnKey]
    return !value || value === '' || value === null || value === undefined
  })
}

// Generate dynamic columns based on data
export function generateDynamicColumns({ data }: { data: ColumnSchema[] }): {
  columns: ColumnDef<ColumnSchema>[]
  columnVisibility: Record<string, boolean>
} {
  const hideMethod = shouldHideColumn(data, 'method')
  const hidePathname = shouldHideColumn(data, 'pathname')
  const hideEventMessage = shouldHideColumn(data, 'event_message')

  const columns: ColumnDef<ColumnSchema>[] = [
    {
      accessorKey: 'select',
      header: '',
      cell: ({ row }) => {
        return (
          <Checkbox
            className="hit-area-2 hover:border-foreground-muted"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      },
      enableHiding: false,
      enableResizing: false,
      enableSorting: false,
      filterFn: () => true,
      size: 42,
      minSize: 42,
      maxSize: 42,
      meta: {
        // pl-3.5 → toggle-filter icon; pr-3 matches date pl-3 (equal gaps around the dot)
        cellClassName: 'w-[42px] min-w-[42px] pl-3.5 pr-3',
        headerClassName: 'w-[42px] min-w-[42px] pl-3.5 pr-3',
      },
    },
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
      filterFn: () => true,
      size: 8,
      minSize: 8,
      maxSize: 8,
      meta: {
        cellClassName: 'w-2 min-w-2 px-0',
        headerClassName: 'w-2 min-w-2 px-0',
      },
    },
    // Date column - always visible
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue<ColumnSchema['date']>('date'))
        return <HoverCardTimestamp date={date} />
      },
      filterFn: () => true,
      enableResizing: false,
      enableSorting: false,
      size: 140,
      minSize: 140,
      maxSize: 140,
      meta: {
        cellClassName: 'font-mono tracking-tight w-[140px] pl-3',
        headerClassName: 'w-[140px] pl-3',
        dataType: 'date',
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
            <LogTypeIcon type={logType} size={14} className="text-foreground-lighter" />
          </div>
        )
      },
      enableHiding: false,
      filterFn: () => true,
      enableResizing: false,
      enableSorting: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
      meta: {
        cellClassName: 'w-[32px]',
        headerClassName: 'w-[32px]',
      },
    },
    // Status column - always visible
    {
      accessorKey: 'status',
      header: '',
      cell: ({ row }) => {
        const value = row.getValue<ColumnSchema['status']>('status')
        const label =
          value != null
            ? (STATUS_CODE_LABELS[String(value) as keyof typeof STATUS_CODE_LABELS] ??
              'Unknown status')
            : null
        return (
          <div className="flex items-center gap-1">
            {/* {row.original.auth_user && (
            // to do: add auth user hover card
              <div>
                <AuthUserHoverCard authUser={row.original.auth_user} />
              </div>
            )} */}
            {label ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DataTableColumnStatusCode
                      value={value}
                      level={row.getValue<ColumnSchema['level']>('level')}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ) : (
              <DataTableColumnStatusCode
                value={value}
                level={row.getValue<ColumnSchema['level']>('level')}
              />
            )}
          </div>
        )
      },
      filterFn: () => true,
      enableResizing: false,
      enableSorting: false,
      size: 70,
      minSize: 70,
      maxSize: 70,
      meta: {
        cellClassName: 'w-[70px]',
        headerClassName: 'w-[70px]',
      },
    },
    // Method column - controlled by columnVisibility
    {
      accessorKey: 'method',
      header: 'Method',
      // Filtering is server-side via the `filter` URL param, like every other
      // column in this table. The built-in `arrIncludesSome` would receive the
      // wrapped { operator, values } shape and reject it.
      filterFn: (_row, _columnId, _filterValue) => true,
      cell: ({ row }) => {
        const value = row.getValue<ColumnSchema['method']>('method')
        return <span className="text-foreground-lighter">{value}</span>
      },
      enableResizing: false,
      enableSorting: false,
      size: 64,
      minSize: 64,
      maxSize: 64,
      meta: {
        // Hidden on narrow viewports so the table fits mobile without horizontal
        // overflow; revealed from `sm` up. Full row detail is still available via
        // the ServiceFlow panel on row click.
        cellClassName: 'font-mono tracking-tight w-[64px] hidden sm:table-cell',
        headerClassName: 'w-[64px] hidden sm:table-cell',
      },
    },
    // Pathname column - controlled by columnVisibility
    {
      accessorKey: 'pathname',
      header: 'Pathname',
      filterFn: () => true,
      enableSorting: false,
      enableResizing: false,
      size: 250,
      minSize: 250,
      maxSize: 250,
      meta: {
        // Hidden until `md` — wider than method, so it earns space one step later.
        cellClassName: 'font-mono tracking-tight w-[250px] hidden md:table-cell',
        headerClassName: 'w-[250px] hidden md:table-cell',
      },
      cell: ({ row }) => {
        const value = row.getValue<ColumnFilterSchema['pathname']>('pathname') ?? ''
        return value
      },
    },
    // Event message column - controlled by columnVisibility
    {
      accessorKey: 'event_message',
      header: 'Event message',
      // No client-side filterFn — event_message uses server-side LIKE/ILIKE via
      // the `filter` URL param (see translateFilter in UnifiedLogs.queries.ts).
      // We still need a no-op so TanStack's default `includesString` doesn't run
      // against the wrapped { operator, values } shape we write.
      filterFn: () => true,
      cell: ({ row }) => {
        const value = row.getValue<ColumnSchema['event_message']>('event_message')
        const logType = row.original.log_type
        const logCount = row.original.log_count
        const { message: displayMessage, capitalize: capitalizeMessage } = getEventMessageDisplay(
          logType,
          value
        )

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
            {displayMessage && (
              <span
                className={cn('text-muted-foreground', capitalizeMessage && 'capitalize-sentence')}
              >
                {displayMessage}
              </span>
            )}
          </div>
        )
      },
      enableResizing: true,
      enableSorting: false,
      size: 200,
      minSize: 200,
      maxSize: 400,
      meta: {
        // Widest column — hidden until `lg`. No width class so it keeps flexing to
        // fill remaining space once shown.
        cellClassName: 'font-mono tracking-tight hidden lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
      },
    },
  ]

  // Define column visibility based on data
  const columnVisibility = {
    method: !hideMethod,
    pathname: !hidePathname,
    event_message: !hideEventMessage,
  }

  return { columns, columnVisibility }
}

// Static fallback columns
export const UNIFIED_LOGS_COLUMNS: ColumnDef<ColumnSchema>[] = generateDynamicColumns({
  data: [],
}).columns
