import { ArrowRight } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface RowCountIndicatorProps {
  actualRows?: number
  estimatedRows?: number
  rowsRemovedByFilter?: number
}

function formatRowCount(rows: number | undefined): string {
  if (rows === undefined) return '-'
  return rows.toLocaleString()
}

type EstimationAccuracy =
  | 'severely-underestimated'
  | 'underestimated'
  | 'severely-overestimated'
  | 'overestimated'
  | 'accurate'
  | 'unknown'

function getEstimationAccuracy(
  actualRows: number | undefined,
  estimatedRows: number | undefined
): EstimationAccuracy {
  if (actualRows === undefined || estimatedRows === undefined) return 'unknown'
  if (estimatedRows === 0) return actualRows === 0 ? 'accurate' : 'severely-underestimated'

  const ratio = actualRows / estimatedRows
  if (ratio > 10) return 'severely-underestimated'
  if (ratio > 2) return 'underestimated'
  if (ratio < 0.1) return 'severely-overestimated'
  if (ratio < 0.5) return 'overestimated'
  return 'accurate'
}

function getAccuracyColorClass(accuracy: EstimationAccuracy): string {
  switch (accuracy) {
    case 'severely-underestimated':
    case 'underestimated':
      return 'text-destructive-600' // Red - more rows than expected
    case 'severely-overestimated':
    case 'overestimated':
      return 'text-warning' // Yellow/Orange - fewer rows than expected
    case 'accurate':
      return 'text-brand' // Green - estimate was accurate
    default:
      return 'text-foreground-light'
  }
}

function getAccuracyDescription(accuracy: EstimationAccuracy): string {
  switch (accuracy) {
    case 'severely-underestimated':
      return 'The planner severely underestimated the row count. Consider running ANALYZE on the table.'
    case 'underestimated':
      return 'The planner underestimated the row count. Statistics may be outdated.'
    case 'severely-overestimated':
      return 'The planner severely overestimated the row count. Consider running ANALYZE on the table.'
    case 'overestimated':
      return 'The planner overestimated the row count. Statistics may be outdated.'
    case 'accurate':
      return "The planner's estimate was accurate."
    default:
      return ''
  }
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

  const accuracy = getEstimationAccuracy(actualRows, estimatedRows)
  const colorClass = getAccuracyColorClass(accuracy)
  const description = getAccuracyDescription(accuracy)

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
            <span className={cn('font-medium', colorClass)}>
              {formatRowCount(actualRows)} {actualRows === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Filter applied</p>
          <p className="text-foreground-lighter text-xs mt-1">
            {formatRowCount(totalRowsScanned)} rows were scanned,{' '}
            {formatRowCount(rowsRemovedByFilter)} were filtered out, leaving{' '}
            {formatRowCount(actualRows)} rows.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Show comparison between estimated and actual
  if (hasActualRows && hasEstimatedRows && actualRows !== estimatedRows) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <span className="text-foreground-muted">est. {formatRowCount(estimatedRows)}</span>
            <ArrowRight size={10} className="text-foreground-muted" />
            <span className={cn('font-medium', colorClass)}>
              {formatRowCount(actualRows)} {actualRows === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Estimated vs actual rows</p>
          <p className="text-foreground-lighter text-xs mt-1">{description}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Simple count (estimate matches actual or only actual available)
  if (hasActualRows) {
    const showAccuracyColor = hasEstimatedRows && accuracy === 'accurate'
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('cursor-help', showAccuracyColor ? colorClass : 'text-foreground-light')}
          >
            {formatRowCount(actualRows)} {actualRows === 1 ? 'row' : 'rows'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Row count</p>
          <p className="text-foreground-lighter text-xs mt-1">
            {showAccuracyColor
              ? "The planner's estimate matched the actual row count."
              : `The operation returned ${formatRowCount(actualRows)} rows.`}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Only estimated rows available
  if (hasEstimatedRows) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-foreground-light cursor-help">
            est. {formatRowCount(estimatedRows)} {estimatedRows === 1 ? 'row' : 'rows'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-sans">
          <p className="font-medium">Estimated rows</p>
          <p className="text-foreground-lighter text-xs mt-1">
            The planner estimates this operation will return {formatRowCount(estimatedRows)} rows.
            Run with ANALYZE to see actual counts.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <span className="text-foreground-muted">-</span>
}

