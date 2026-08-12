'use client'

import type { Key, ReactNode } from 'react'
import { useMemo } from 'react'
import DataGrid, { type Column } from 'react-data-grid'
import { cn } from 'ui'

import type {
  QueryResultColumn,
  QueryResultData,
  QueryResultRow,
  QueryResultTableConfig,
} from '../ExplorerQuery/ExplorerQuery.types'

export type QueryResultTableProps = {
  data: QueryResultData
  config?: QueryResultTableConfig
  onConfigChange?: (config: QueryResultTableConfig) => void
  getRowKey?: (row: QueryResultRow) => Key
  renderValue?: (args: {
    column: QueryResultColumn
    row: QueryResultRow
    value: unknown
  }) => ReactNode
  ariaLabel?: string
  className?: string
}

const formatQueryResultValue = (value: unknown): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'bigint') return value.toString()

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

/** Virtualized, controlled renderer for source-neutral query results. */
const QueryResultTable = ({
  data,
  config,
  onConfigChange,
  getRowKey,
  renderValue,
  ariaLabel = 'Query results',
  className,
}: QueryResultTableProps) => {
  const columns = useMemo<readonly Column<QueryResultRow>[]>(
    () =>
      data.columns.map((column) => ({
        key: column.key,
        name: column.label ?? column.key,
        width: config?.columnWidths?.[column.key] ?? column.width,
        minWidth: column.minWidth ?? 120,
        resizable: true,
        renderHeaderCell: () => (
          <div
            className={cn(
              'heading-meta flex h-full w-full items-center whitespace-nowrap text-foreground-lighter transition-colors',
              column.align === 'right' && 'justify-end text-right'
            )}
            title={column.dataType}
          >
            {column.label ?? column.key}
          </div>
        ),
        renderCell: ({ row }) => {
          const value = row[column.key]
          const formattedValue = formatQueryResultValue(value)

          return (
            <div
              className={cn(
                'flex h-full w-full items-center overflow-hidden text-xs transition-colors',
                column.align === 'right' && 'justify-end text-right',
                value === null && 'text-foreground-lighter'
              )}
              title={formattedValue}
            >
              <span className="truncate">
                {renderValue ? renderValue({ column, row, value }) : formattedValue}
              </span>
            </div>
          )
        },
      })),
    [config?.columnWidths, data.columns, renderValue]
  )

  return (
    <div
      data-slot="query-result-table"
      className={cn('flex min-h-0 w-full flex-1 flex-col overflow-hidden', className)}
    >
      <DataGrid<QueryResultRow>
        aria-label={ariaLabel}
        columns={columns}
        rows={data.rows}
        rowKeyGetter={getRowKey}
        className={cn(
          'min-h-0 flex-1 border-0! bg-dash-canvas text-xs',
          '[&_.rdg-header-row>.rdg-cell]:border-0! [&_.rdg-header-row>.rdg-cell]:border-b! [&_.rdg-header-row>.rdg-cell]:bg-200 [&_.rdg-header-row>.rdg-cell]:px-3!'
        )}
        headerRowHeight={32}
        rowHeight={32}
        rowClass={(_, rowIndex) =>
          cn(
            'group bg-dash-canvas transition-colors hover:bg-surface-200',
            '[&>.rdg-cell]:items-center [&>.rdg-cell]:border-0! [&>.rdg-cell]:border-b! [&>.rdg-cell]:px-3!',
            rowIndex === data.rows.length - 1 && '[&>.rdg-cell]:border-b-0!'
          )
        }
        renderers={{
          noRowsFallback: (
            <p className="m-0 p-3 text-xs text-foreground-muted">Success. No rows returned</p>
          ),
        }}
        onColumnResize={(index, width) => {
          const column = data.columns[index]
          if (!column) return

          onConfigChange?.({
            ...config,
            columnWidths: {
              ...config?.columnWidths,
              [column.key]: width,
            },
          })
        }}
      />
    </div>
  )
}
QueryResultTable.displayName = 'QueryResultTable'

export { formatQueryResultValue, QueryResultTable }
