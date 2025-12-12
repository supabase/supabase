import { ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface RowCountIndicatorProps {
  actualRows?: number
  estimatedRows?: number
  rowsRemovedByFilter?: number
}

const formatCount = (value?: number): string => value?.toLocaleString() ?? 'Unknown'

type EstimationAccuracy =
  | 'severely underestimated'
  | 'underestimated'
  | 'severely overestimated'
  | 'overestimated'
  | 'accurate'
  | 'unknown'

function getEstimationAccuracy(actualRows: number, estimatedRows: number): EstimationAccuracy {
  if (!estimatedRows || estimatedRows === 0) {
    // If estimatedRows is zero or falsy, we can't compute a ratio—treat as severely underestimated
    return 'unknown'
  }
  const ratio = actualRows / estimatedRows
  if (ratio > 10) return 'severely underestimated'
  if (ratio > 2) return 'underestimated'
  if (ratio < 0.1) return 'severely overestimated'
  if (ratio < 0.5) return 'overestimated'
  return 'accurate'
}

/** Shows: scanned → filtered out → remaining */
function FilterFlowIndicator({
  totalRowsScanned,
  rowsRemovedByFilter,
  actualRows,
}: {
  totalRowsScanned: number
  rowsRemovedByFilter: number
  actualRows: number
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-foreground-lighter cursor-help">
          <span>{formatCount(totalRowsScanned)} rows</span>
          <ArrowRight size={10} className="text-foreground-muted" />
          <span className="text-destructive-600 font-medium">
            -{formatCount(rowsRemovedByFilter)}
          </span>
          <ArrowRight size={10} className="text-foreground-muted" />
          <span className="text-brand font-medium">{formatCount(actualRows)} rows</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">Filter applied</p>
        <p className="text-foreground-lighter text-xs mt-1">
          {formatCount(totalRowsScanned)} rows were scanned, {formatCount(rowsRemovedByFilter)} were
          filtered out, leaving {formatCount(actualRows)} rows. Consider adding an index to reduce
          rows scanned.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/** Shows a simple count when estimated equals actual */
function SimpleCountIndicator({ rows }: { rows: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-foreground-light font-medium text-xs cursor-help">
          {formatCount(rows)} rows
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

/** Shows comparison between estimated and actual rows */
function ComparisonIndicator({
  actualRows,
  estimatedRows,
}: {
  actualRows?: number
  estimatedRows?: number
}) {
  const hasBothValues = actualRows !== undefined && estimatedRows !== undefined
  const hasOnlyActual = actualRows !== undefined && estimatedRows === undefined

  const title = hasBothValues
    ? 'Estimated vs actual rows'
    : hasOnlyActual
      ? 'Actual rows'
      : 'Estimated rows'

  const description = getComparisonDescription({ actualRows, estimatedRows })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-foreground-lighter cursor-help">
          {estimatedRows !== undefined && <span>est. {formatCount(estimatedRows)}</span>}
          {actualRows !== undefined && (
            <>
              {estimatedRows !== undefined && (
                <ArrowRight size={10} className="text-foreground-muted" />
              )}
              <span className="text-foreground-light font-medium">
                {formatCount(actualRows)} rows
              </span>
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{title}</p>
        <p className="text-foreground-lighter text-xs mt-1">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function getComparisonDescription({
  actualRows,
  estimatedRows,
}: {
  actualRows?: number
  estimatedRows?: number
}): string {
  const hasBothValues = actualRows !== undefined && estimatedRows !== undefined

  if (!hasBothValues) {
    if (actualRows !== undefined) {
      return `The operation returned ${formatCount(actualRows)} rows.`
    }
    return `The planner estimates this operation will return ${formatCount(estimatedRows)} rows. Run with ANALYZE to see actual counts.`
  }

  const accuracy = getEstimationAccuracy(actualRows, estimatedRows)
  const hasEstimationIssue = accuracy !== 'accurate'

  if (hasEstimationIssue) {
    return `The planner ${accuracy} the row count (estimated ${formatCount(estimatedRows)}, got ${formatCount(actualRows)}). This may indicate outdated statistics — consider running ANALYZE on the table.`
  }

  return `The planner estimated ${formatCount(estimatedRows)} rows and ${formatCount(actualRows)} were returned. The estimate was reasonably accurate.`
}

export function RowCountIndicator({
  actualRows,
  estimatedRows,
  rowsRemovedByFilter,
}: RowCountIndicatorProps) {
  const hasData = actualRows !== undefined || estimatedRows !== undefined
  if (!hasData) return undefined

  const hasFilterData = rowsRemovedByFilter !== undefined && actualRows !== undefined
  const totalRowsScanned = hasFilterData ? actualRows + rowsRemovedByFilter : undefined

  // Priority 1: Show filter flow if we have filter data
  if (hasFilterData && totalRowsScanned !== undefined) {
    return (
      <FilterFlowIndicator
        totalRowsScanned={totalRowsScanned}
        rowsRemovedByFilter={rowsRemovedByFilter}
        actualRows={actualRows}
      />
    )
  }

  // Priority 2: Show simple count if estimate matches actual exactly
  const estimateMatchesActual =
    actualRows !== undefined && estimatedRows !== undefined && actualRows === estimatedRows

  if (estimateMatchesActual) {
    return <SimpleCountIndicator rows={actualRows} />
  }

  // Priority 3: Show comparison view
  return <ComparisonIndicator actualRows={actualRows} estimatedRows={estimatedRows} />
}
