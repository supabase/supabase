import { useMemo } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import { formatBytes, formatCurrency } from '@/lib/helpers'

interface RestartCostEstimateProps {
  open: boolean
  projectRef?: string
  sourceId?: number
  publicationName?: string
  tableNames: string[]
}

interface EstimatedTable {
  schema: string
  name: string
  estimated_bytes: number
  estimated_cost: number
  is_row_filtered: boolean
}

export const calculateRestartCostEstimate = (tables: EstimatedTable[], tableNames: string[]) => {
  const tableNameSet = new Set(tableNames)
  const matchedTables = tables.filter((table) => tableNameSet.has(`${table.schema}.${table.name}`))

  return {
    isComplete: matchedTables.length === tableNames.length,
    estimatedBytes: matchedTables.reduce((total, table) => total + table.estimated_bytes, 0),
    estimatedCost: matchedTables.reduce((total, table) => total + table.estimated_cost, 0),
    hasRowFilteredTables: matchedTables.some((table) => table.is_row_filtered),
  }
}

export const RestartCostEstimate = ({
  open,
  projectRef,
  sourceId,
  publicationName,
  tableNames,
}: RestartCostEstimateProps) => {
  const { data: estimate, isFetching } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: open }
  )
  const restartEstimate = useMemo(
    () =>
      estimate === undefined
        ? undefined
        : calculateRestartCostEstimate(estimate.table_copy.tables, tableNames),
    [estimate, tableNames]
  )
  return (
    <div className="border-t p-4">
      {isFetching ? (
        <GenericSkeletonLoader className="w-full" />
      ) : restartEstimate?.isComplete ? (
        <div className="flex items-center justify-between gap-x-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">Estimated additional initial sync</p>
            <p className="text-xs text-foreground-lighter">
              {formatBytes(restartEstimate.estimatedBytes)} across {tableNames.length}{' '}
              {tableNames.length === 1 ? 'table' : 'tables'}
            </p>
          </div>
          <span className="shrink-0 font-mono text-lg font-semibold" translate="no">
            {formatCurrency(restartEstimate.estimatedCost)}
            {restartEstimate.hasRowFilteredTables ? '*' : null}
          </span>
        </div>
      ) : (
        <p className="text-xs text-foreground-lighter">
          A cost estimate is unavailable. You can still restart the{' '}
          {tableNames.length === 1 ? 'table' : 'tables'}.
        </p>
      )}
      {restartEstimate?.isComplete && restartEstimate.hasRowFilteredTables && (
        <p className="mt-2 text-xs text-foreground-lighter">
          *Tables with row filters may cost less than shown.
        </p>
      )}
    </div>
  )
}
