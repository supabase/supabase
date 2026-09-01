import { useMemo } from 'react'
import {
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  getTableCopyTargets,
  summarizeTableCopyEstimate,
  type ReplicationTableIdentity,
  type TableSyncCopyConfig,
} from '../TableSyncCopy.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import { DOCS_URL } from '@/lib/constants'
import { formatBytes, formatCurrency } from '@/lib/helpers'

const MAX_VISIBLE_TABLES = 10

export const PipelineCostEstimate = ({
  estimate,
  isLoading,
  isError,
  publicationTables,
  tableSyncCopy,
}: {
  estimate?: ReplicationCostEstimateData
  isLoading: boolean
  isError: boolean
  publicationTables: ReplicationTableIdentity[]
  tableSyncCopy?: TableSyncCopyConfig
}) => {
  const copyTargets = useMemo(
    () => getTableCopyTargets(publicationTables, tableSyncCopy),
    [publicationTables, tableSyncCopy]
  )
  const copyEstimate = useMemo(
    () =>
      estimate === undefined
        ? undefined
        : summarizeTableCopyEstimate(estimate.table_copy.tables, copyTargets),
    [copyTargets, estimate]
  )
  const tables = copyEstimate?.tables ?? []
  const visibleTables = tables.slice(0, MAX_VISIBLE_TABLES)
  const hiddenTableCount = tables.length - visibleTables.length
  const copyTableCount = copyTargets.length

  return (
    <CardContent className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-sm text-foreground">Estimated costs</h3>
        <p className="text-sm text-foreground-light">
          Review one-time and ongoing Supabase charges. Destination-provider charges are separate.
        </p>
      </header>

      {isLoading ? (
        <GenericSkeletonLoader className="w-full" />
      ) : isError || estimate === undefined ? (
        <p className="text-sm text-foreground-light" role="status">
          A cost estimate is unavailable. You can still start the pipeline.
        </p>
      ) : (
        <div className="space-y-6">
          <section className="space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-3">Initial sync</h4>

            {copyTableCount === 0 ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableBody className="[&_td]:py-2">
                    <TableRow>
                      <TableCell className="text-sm text-foreground-light">
                        No tables will run an initial sync
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm" translate="no">
                        {formatCurrency(0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : copyEstimate?.isComplete ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader className="[&_th]:h-auto [&_th]:py-2 [&_th]:text-sm">
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Est. volume</TableHead>
                      <TableHead className="text-right" translate="no">
                        Est. cost ({formatCurrency(estimate.table_copy.rate_per_gb)}/GB)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_td]:py-2 [&_td]:text-sm">
                    {visibleTables.map((table) => (
                      <TableRow key={JSON.stringify([table.schema, table.name])}>
                        <TableCell className="font-mono" translate="no">
                          {table.schema}.{table.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(table.estimated_bytes)}
                        </TableCell>
                        <TableCell className="text-right font-mono" translate="no">
                          {formatCurrency(table.estimated_cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {hiddenTableCount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-foreground-lighter">
                          +{hiddenTableCount} more {hiddenTableCount === 1 ? 'table' : 'tables'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter className="[&_td]:text-sm">
                    <TableRow className="border-b-0">
                      <TableCell className="py-2">Initial sync total</TableCell>
                      <TableCell className="py-2 text-right">
                        {formatBytes(copyEstimate.estimatedBytes)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono" translate="no">
                        {formatCurrency(copyEstimate.estimatedCost)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <p className="px-3 py-2 text-sm text-foreground-light">
                  Estimate unavailable for one or more selected tables
                </p>
              </div>
            )}

            <p className="text-sm text-foreground-lighter">
              Final charges are based on data processed during initial sync.
              {copyEstimate?.isComplete && copyEstimate.hasRowFilteredTables
                ? ' Row filters may reduce this amount.'
                : ''}
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-3">Ongoing</h4>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableBody className="[&_td]:py-2 [&_td]:text-sm">
                  <TableRow>
                    <TableCell className="text-foreground-light">Pipeline runtime</TableCell>
                    <TableCell className="text-right font-mono text-foreground" translate="no">
                      ${estimate.pipeline.hourly_cost}/hour
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-foreground-light">
                      Replication data processed
                    </TableCell>
                    <TableCell className="text-right font-mono text-foreground" translate="no">
                      {formatCurrency(estimate.streaming.rate_per_gb)}/GB
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-foreground-lighter">
              Replication usage depends on how often published data changes. See{' '}
              <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/pipelines`}>
                how data processed is measured
              </InlineLink>
              .
            </p>
          </section>
        </div>
      )}
    </CardContent>
  )
}
