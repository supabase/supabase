import { useMemo } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  summarizeTableCopyEstimate,
  type ReplicationTableIdentity,
  type TableCopyEstimate,
} from './TableSyncCopy.utils'
import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import { formatBytes, formatCurrency } from '@/lib/helpers'

interface RestartCostEstimateProps {
  open: boolean
  projectRef?: string
  sourceId?: number
  publicationName?: string
  tables: Pick<ReplicationTableIdentity, 'schema' | 'name'>[]
}

export const calculateRestartCostEstimate = (
  estimates: TableCopyEstimate[],
  tables: Pick<ReplicationTableIdentity, 'schema' | 'name'>[]
) => summarizeTableCopyEstimate(estimates, tables)

export const RestartCostEstimate = ({
  open,
  projectRef,
  sourceId,
  publicationName,
  tables,
}: RestartCostEstimateProps) => {
  const { data: estimate, isFetching } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: open && tables.length > 0 }
  )
  const restartEstimate = useMemo(
    () =>
      estimate === undefined
        ? undefined
        : calculateRestartCostEstimate(estimate.table_copy.tables, tables),
    [estimate, tables]
  )
  return (
    <div className="border-t p-4">
      {tables.length === 0 ? (
        <div className="flex items-center justify-between gap-x-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">No additional initial-sync copy charge</p>
            <p className="text-xs text-foreground-lighter">
              Initial copy is skipped by this pipeline's table-copy policy.
            </p>
          </div>
          <span className="shrink-0 font-mono text-lg font-semibold" translate="no">
            {formatCurrency(0)}
          </span>
        </div>
      ) : isFetching ? (
        <GenericSkeletonLoader className="w-full" />
      ) : restartEstimate?.isComplete ? (
        <div className="flex items-center justify-between gap-x-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">Estimated additional initial sync</p>
            <p className="text-xs text-foreground-lighter">
              {formatBytes(restartEstimate.estimatedBytes)} across {tables.length}{' '}
              {tables.length === 1 ? 'table' : 'tables'}
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
          {tables.length === 1 ? 'table' : 'tables'}.
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
