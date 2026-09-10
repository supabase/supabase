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
            <p className="text-sm font-medium">No additional initial sync charge</p>
            <p className="text-xs text-foreground-lighter">
              This restart will skip initial sync based on the pipeline's settings.
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
            <p className="text-sm font-medium">Estimated additional initial sync cost</p>
            <p className="text-xs text-foreground-lighter">
              Based on an estimated {formatBytes(restartEstimate.estimatedBytes)} of initial sync
              data across {tables.length} {tables.length === 1 ? 'table' : 'tables'}
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
          *Row filters can reduce the data processed compared with this estimate.
        </p>
      )}
      {restartEstimate?.isComplete && (
        <p className="mt-2 text-xs text-foreground-lighter">
          Quick planning estimate; the final charge is based on successfully processed initial sync
          data, which is billed again.
        </p>
      )}
    </div>
  )
}
