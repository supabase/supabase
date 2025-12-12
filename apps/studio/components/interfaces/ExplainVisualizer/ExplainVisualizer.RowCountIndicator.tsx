import { ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface RowCountIndicatorProps {
  actualRows: number | null
  estimatedRows: number | null
  rowsRemovedByFilter?: number
}

export function RowCountIndicator({
  actualRows,
  estimatedRows,
  rowsRemovedByFilter,
}: RowCountIndicatorProps) {
  const hasData = actualRows !== null || estimatedRows !== null
  if (!hasData) return null

  const totalRowsScanned =
    rowsRemovedByFilter && actualRows !== null ? actualRows + rowsRemovedByFilter : null

  const showFilterFlow = totalRowsScanned !== null && rowsRemovedByFilter
  const showSimpleCount =
    !showFilterFlow && actualRows !== null && estimatedRows !== null && actualRows === estimatedRows
  const showComparison = !showFilterFlow && !showSimpleCount

  // Calculate estimation accuracy for tooltip
  const getEstimationAccuracy = () => {
    if (actualRows === null || estimatedRows === null || estimatedRows === 0) return null
    const ratio = actualRows / estimatedRows
    if (ratio > 10) return 'severely underestimated'
    if (ratio > 2) return 'underestimated'
    if (ratio < 0.1) return 'severely overestimated'
    if (ratio < 0.5) return 'overestimated'
    return 'accurate'
  }

  if (showFilterFlow) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-foreground-lighter cursor-help">
            <span>{totalRowsScanned!.toLocaleString()} rows</span>
            <ArrowRight size={10} className="text-foreground-muted" />
            <span className="text-destructive-600 font-medium">
              -{rowsRemovedByFilter!.toLocaleString()}
            </span>
            <ArrowRight size={10} className="text-foreground-muted" />
            <span className="text-brand font-medium">{actualRows?.toLocaleString()} rows</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Filter applied</p>
          <p className="text-foreground-lighter text-xs mt-1">
            {totalRowsScanned!.toLocaleString()} rows were scanned,{' '}
            {rowsRemovedByFilter!.toLocaleString()} were filtered out, leaving{' '}
            {actualRows?.toLocaleString()} rows. Consider adding an index to reduce rows scanned.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (showSimpleCount) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-foreground-light font-medium text-xs cursor-help">
            {actualRows!.toLocaleString()} rows
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Row count</p>
          <p className="text-foreground-lighter text-xs mt-1">
            The planner's estimate matched the actual row count exactly.
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (showComparison) {
    const accuracy = getEstimationAccuracy()
    const hasEstimationIssue = accuracy && !['accurate'].includes(accuracy)

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-foreground-lighter cursor-help">
            {estimatedRows !== null && <span>est. {estimatedRows.toLocaleString()}</span>}
            {actualRows !== null && (
              <>
                {estimatedRows !== null && (
                  <ArrowRight size={10} className="text-foreground-muted" />
                )}
                <span className="text-foreground-light font-medium">
                  {actualRows.toLocaleString()} rows
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">
            {actualRows !== null && estimatedRows !== null
              ? 'Estimated vs actual rows'
              : actualRows !== null
                ? 'Actual rows'
                : 'Estimated rows'}
          </p>
          <p className="text-foreground-lighter text-xs mt-1">
            {actualRows !== null && estimatedRows !== null ? (
              hasEstimationIssue ? (
                <>
                  The planner {accuracy} the row count (estimated {estimatedRows.toLocaleString()},
                  got {actualRows.toLocaleString()}). This may indicate outdated statistics —
                  consider running ANALYZE on the table.
                </>
              ) : (
                <>
                  The planner estimated {estimatedRows.toLocaleString()} rows and{' '}
                  {actualRows.toLocaleString()} were returned. The estimate was reasonably accurate.
                </>
              )
            ) : actualRows !== null ? (
              <>The operation returned {actualRows.toLocaleString()} rows.</>
            ) : (
              <>
                The planner estimates this operation will return {estimatedRows!.toLocaleString()}{' '}
                rows. Run with ANALYZE to see actual counts.
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}
