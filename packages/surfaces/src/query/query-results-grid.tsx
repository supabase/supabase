import { KeyRoundIcon, PencilIcon } from 'lucide-react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { displayValue } from '../common'
import type { Row, Table } from '../contract'

export interface QueryResultsGridProps {
  rows: readonly Row[]
  columns: string[]
  /** Metadata from the table transport. Absent for custom SQL. */
  table?: Table
  /** Row number of the first row, for paginated table reads. */
  offset?: number
  /** Shows an edit action per row that calls `onEditRow`. */
  canEdit?: boolean
  isBusy?: boolean
  onEditRow?: (row: Row) => void
}

function cellClassName(value: unknown) {
  if (value == null) return 'text-foreground-muted'
  if (typeof value === 'number') return 'text-right tabular-nums'
  return undefined
}

function CellValue({ value }: { value: unknown }) {
  if (typeof value === 'boolean') {
    return <span className={value ? 'text-brand' : 'text-foreground-light'}>{String(value)}</span>
  }
  return <>{displayValue(value)}</>
}

/** A compact, read-first results grid. Editing happens in the row editor. */
export function QueryResultsGrid({
  rows,
  columns,
  table,
  offset = 0,
  canEdit = false,
  isBusy = false,
  onEditRow,
}: QueryResultsGridProps) {
  return (
    <table
      aria-label="Query results"
      className="w-max min-w-full border-collapse font-mono text-xs"
    >
      <thead className="sticky top-0 z-10 bg-surface-200">
        <tr>
          <th
            aria-label="Row number"
            className="sticky left-0 w-10 border-b border-r bg-surface-200 px-2 py-1.5 text-right font-normal text-foreground-lighter"
          >
            #
          </th>
          {columns.map((column) => {
            const metadata = table?.columns.find((item) => item.name === column)
            const isPrimaryKey = table?.primary_keys.includes(column) ?? false
            return (
              <th
                key={column}
                scope="col"
                className="border-b border-r px-2 py-1.5 text-left font-normal text-foreground"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {isPrimaryKey && (
                    <KeyRoundIcon
                      size={12}
                      aria-label="Primary key"
                      className="text-foreground-lighter"
                    />
                  )}
                  <span>{column}</span>
                  {metadata && (
                    <span className="font-sans text-foreground-lighter">{metadata.format}</span>
                  )}
                </span>
              </th>
            )
          })}
          {canEdit && <th aria-label="Row actions" className="w-9 border-b bg-surface-200" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const rowNumber = offset + index + 1
          return (
            <tr
              key={index}
              className="group hover:bg-surface-100"
              onDoubleClick={() => {
                if (canEdit && !isBusy) onEditRow?.(row)
              }}
            >
              <td className="sticky left-0 border-b border-r bg-background px-2 py-1 text-right text-foreground-lighter group-hover:bg-surface-100">
                {rowNumber}
              </td>
              {columns.map((column) => (
                <td
                  key={column}
                  title={displayValue(row[column])}
                  className={cn(
                    'max-w-80 truncate border-b border-r px-2 py-1 text-foreground',
                    cellClassName(row[column])
                  )}
                >
                  <CellValue value={row[column]} />
                </td>
              ))}
              {canEdit && (
                <td className="border-b px-1 py-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="text"
                        size="tiny"
                        className="w-7 px-0"
                        aria-label={`Edit row ${rowNumber}`}
                        disabled={isBusy}
                        icon={<PencilIcon size={13} />}
                        onClick={() => onEditRow?.(row)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="left">Edit row</TooltipContent>
                  </Tooltip>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
