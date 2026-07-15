import { useEffect } from 'react'
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import { useLatest } from '@/hooks/misc/useLatest'
import { formatBytes, formatCurrency } from '@/lib/helpers'

const MAX_VISIBLE_TABLES = 10

interface PipelineCostDialogProps {
  open: boolean
  isConfirming: boolean
  projectRef?: string
  sourceId?: number
  publicationName?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Shows an estimate of what the pipeline will cost (one-time initial copy, hourly pipeline
 * fee, and the usage-based streaming rate).
 *
 * This should be a non-blocking enhancement - so if there's an error while fetching the
 * pricing estimate, we skip this gate rather than block the user from creating pipeline
 */
export const PipelineCostDialog = ({
  open,
  isConfirming,
  projectRef,
  sourceId,
  publicationName,
  onOpenChange,
  onConfirm,
}: PipelineCostDialogProps) => {
  const onConfirmRef = useLatest(onConfirm)

  const {
    data: estimate,
    isLoading,
    isError,
    isSuccess,
  } = useReplicationCostEstimateQuery({ projectRef, sourceId, publicationName }, { enabled: open })

  const tables = estimate?.table_copy.tables ?? []
  const tableCount = tables.length
  const visibleTables = tables.slice(0, MAX_VISIBLE_TABLES)
  const hiddenTableCount = tableCount - visibleTables.length
  const hasRowFilteredTables = tables.some((table) => table.is_row_filtered)

  const firstMonthTotal =
    (estimate?.table_copy.total_cost ?? 0) + (estimate?.pipeline.monthly_cost ?? 0)

  useEffect(() => {
    if (open && isError) onConfirmRef.current()
  }, [open, isError, onConfirmRef])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Confirm to create and start pipeline</DialogTitle>
          <DialogDescription>
            Review the estimated costs before you create and start the pipeline.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        {/* Review these costs before you create and start the pipeline. */}
        {isLoading || isError ? (
          <DialogSection className="py-6">
            <GenericSkeletonLoader className="w-full" />
          </DialogSection>
        ) : (
          isSuccess &&
          estimate && (
            <>
              <DialogSection className="flex flex-col gap-y-5">
                <p className="text-sm text-foreground-light">
                  This pipeline will replicate{' '}
                  <span className="text-foreground">
                    {tableCount} {tableCount === 1 ? 'table' : 'tables'}
                  </span>
                  {publicationName ? (
                    <>
                      {' '}
                      from the{' '}
                      <span className="text-foreground" translate="no">
                        {publicationName}
                      </span>{' '}
                      publication
                    </>
                  ) : null}
                  .
                </p>

                <div className="flex flex-col gap-y-2">
                  <p className="text-sm font-medium text-foreground">Initial table copy</p>

                  {tableCount > 0 ? (
                    <Card>
                      <Table>
                        <TableHeader className="[&_th]:h-auto [&_th]:py-2">
                          <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead className="text-right">Est. size</TableHead>
                            <TableHead className="text-right" translate="no">
                              Est. cost ({formatCurrency(estimate.table_copy.rate_per_gb)}/GB)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&_td]:py-2">
                          {visibleTables.map((table) => (
                            <TableRow key={`${table.schema}.${table.name}`}>
                              <TableCell className="font-mono text-xs" translate="no">
                                {table.schema}.{table.name}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {formatBytes(table.estimated_bytes)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs" translate="no">
                                {formatCurrency(table.estimated_cost)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {hiddenTableCount > 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-xs text-foreground-lighter">
                                +{hiddenTableCount} more{' '}
                                {hiddenTableCount === 1 ? 'table' : 'tables'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="py-2">Total</TableCell>
                            <TableCell className="text-right py-2 text-xs">
                              {formatBytes(estimate.table_copy.total_bytes)}
                            </TableCell>
                            <TableCell className="text-right py-2 font-mono" translate="no">
                              {formatCurrency(estimate.table_copy.total_cost)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </Card>
                  ) : (
                    <p className="text-sm text-foreground-light">
                      This publication has no tables to copy.
                    </p>
                  )}
                </div>
              </DialogSection>

              <DialogSectionSeparator />

              <DialogSection className="flex flex-col gap-y-5">
                <div className="flex flex-col gap-y-2">
                  <p className="text-sm font-medium text-foreground">Ongoing</p>
                  <div className="flex items-center justify-between gap-x-4 text-sm">
                    <span className="text-foreground-light">Active pipeline</span>
                    <span className="shrink-0 text-right font-mono text-foreground" translate="no">
                      ${estimate.pipeline.hourly_cost}/hour{' '}
                      <span className="text-foreground-lighter">
                        (~{formatCurrency(estimate.pipeline.monthly_cost)}/month)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-x-4 text-sm">
                    <span className="text-foreground-light">Streaming changes</span>
                    <span className="shrink-0 text-right font-mono text-foreground" translate="no">
                      {formatCurrency(estimate.streaming.rate_per_gb)}/GB
                    </span>
                  </div>
                  <p className="text-xs text-foreground-lighter">
                    Streaming is billed on the volume of changes replicated after the initial copy,
                    so the total depends on how often your data changes.
                  </p>
                </div>

                <div className="flex flex-col gap-y-2">
                  <div className="flex items-center justify-between gap-x-6 rounded-md border bg-surface-100 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Estimated first month total
                      </p>
                      <p className="text-xs text-foreground-lighter">
                        Initial copy + first pipeline fee, excluding usage-based streaming
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-right font-mono text-lg font-semibold text-foreground"
                      translate="no"
                    >
                      {formatCurrency(firstMonthTotal)}
                      {hasRowFilteredTables ? '*' : null}
                    </span>
                  </div>

                  {hasRowFilteredTables && (
                    <p className="text-xs text-foreground-lighter">
                      *Tables with row filters may cost less than shown.
                    </p>
                  )}
                </div>
              </DialogSection>
            </>
          )
        )}

        <DialogFooter>
          <Button variant="default" disabled={isConfirming} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isConfirming}
            disabled={isConfirming || isLoading || isError}
            onClick={onConfirm}
          >
            Create and start pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
