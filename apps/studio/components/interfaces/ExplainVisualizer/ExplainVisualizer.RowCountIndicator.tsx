import { ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface RowCountIndicatorProps {
  actualRows?: number
  estimatedRows?: number
  rowsRemovedByFilter?: number
}

function formatRowCount(rows: number | undefined): string {
  if (rows === undefined) return '-'
  return rows.toLocaleString()
}

export function RowCountIndicator({
  actualRows,
  estimatedRows,
  rowsRemovedByFilter,
}: RowCountIndicatorProps) {
  const hasActualRows = actualRows !== undefined
  const hasEstimatedRows = estimatedRows !== undefined
  const hasFilterData = rowsRemovedByFilter !== undefined && hasActualRows
  const totalRowsScanned = hasFilterData ? actualRows + rowsRemovedByFilter : undefined

  // Show filter flow: scanned → filtered out → remaining
  if (hasFilterData && totalRowsScanned !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <span className="text-foreground-light">{formatRowCount(totalRowsScanned)}</span>
            <ArrowRight size={10} className="text-foreground-muted" />
            <span className="text-destructive-600 font-medium">
              -{formatRowCount(rowsRemovedByFilter)}
            </span>
            <ArrowRight size={10} className="text-foreground-muted" />
            <span className="text-brand font-medium">
              {formatRowCount(actualRows)} {actualRows === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Filter applied</p>
          <p className="text-foreground-lighter text-xs mt-1">
            {formatRowCount(totalRowsScanned)} rows were scanned,{' '}
            {formatRowCount(rowsRemovedByFilter)} were filtered out, leaving{' '}
            {formatRowCount(actualRows)} rows. Consider adding an index to reduce rows scanned.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Simple row count with actual rows
  if (hasActualRows) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-foreground-light cursor-help">
            {formatRowCount(actualRows)} {actualRows === 1 ? 'row' : 'rows'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Rows returned</p>
          <p className="text-foreground-lighter text-xs mt-1">
            This operation processed and returned {formatRowCount(actualRows)} rows.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Only estimated rows available (EXPLAIN without ANALYZE)
  if (hasEstimatedRows) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-foreground-muted cursor-help">
            est. {formatRowCount(estimatedRows)} {estimatedRows === 1 ? 'row' : 'rows'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Estimated rows</p>
          <p className="text-foreground-lighter text-xs mt-1">
            The planner estimates this operation will return {formatRowCount(estimatedRows)} rows.
            Run with EXPLAIN ANALYZE to see actual row counts.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <span className="text-foreground-muted">-</span>
}
