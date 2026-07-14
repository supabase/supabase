import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  Button,
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

import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import { formatBytes, formatCurrency } from '@/lib/helpers'

// Dialogs render at most this many table rows individually; the rest are
// summarized as a single "+N more" line. The table footer total below always
// covers every replicated table regardless of how many rows are rendered.
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

// Final gate before a pipeline is created and started: shows an estimate of what
// the pipeline will cost (one-time initial copy, hourly pipeline fee, and the
// usage-based streaming rate) so customers can make an informed decision and
// avoid bill shock. Shown for every customer.
export const PipelineCostDialog = ({
  open,
  isConfirming,
  projectRef,
  sourceId,
  publicationName,
  onOpenChange,
  onConfirm,
}: PipelineCostDialogProps) => {
  const {
    data: estimate,
    isLoading,
    isError,
    isSuccess,
  } = useReplicationCostEstimateQuery({ projectRef, sourceId, publicationName }, { enabled: open })

  // Cost estimation is a non-blocking enhancement: pricing has to come from the
  // backend, never a frontend fallback, so if it can't be fetched we skip the
  // gate entirely rather than showing an error the user can't act on.
  //
  // `onConfirm` gets a new identity on every parent render, so it's read via a
  // ref instead of listed as a dependency — otherwise an unrelated parent
  // re-render while the dialog is still closing (`open` hasn't flipped to
  // `false` yet) would re-trigger this effect and call `onConfirm` (and thus
  // submit the pipeline) a second time.
  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  useEffect(() => {
    if (open && isError) {
      onConfirmRef.current()
    }
  }, [open, isError])

  const tables = estimate?.table_copy.tables ?? []
  const tableCount = tables.length
  const visibleTables = tables.slice(0, MAX_VISIBLE_TABLES)
  const hiddenTableCount = tableCount - visibleTables.length
  const hasRowFilteredTables = tables.some((table) => table.is_row_filtered)

  // The only two components that are knowable up front; streaming is
  // usage-based and deliberately excluded from this figure.
  const firstMonthTotal =
    (estimate?.table_copy.total_cost ?? 0) + (estimate?.pipeline.monthly_cost ?? 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Review estimated costs</DialogTitle>
          <DialogDescription>
            An estimate of what this pipeline will cost before you create and start it.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        {isLoading || isError ? (
          <DialogSection className="flex items-center gap-x-2 py-6">
            <Loader2 className="animate-spin" size={16} />
            <p className="text-sm text-foreground-light">Estimating costs...</p>
          </DialogSection>
        ) : isSuccess && estimate ? (
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
                    {hiddenTableCount > 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-xs text-foreground-lighter">
                          +{hiddenTableCount} more {hiddenTableCount === 1 ? 'table' : 'tables'}
                        </TableCell>
                      </TableRow>
                    ) : null}
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
              ) : (
                <p className="text-sm text-foreground-light">
                  This publication has no tables to copy.
                </p>
              )}
            </div>

            <DialogSectionSeparator />

            <div className="flex flex-col gap-y-2">
              <p className="text-sm font-medium text-foreground">Ongoing</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-light">Active pipeline</span>
                <span className="font-mono text-foreground" translate="no">
                  ${estimate.pipeline.hourly_cost}/hour{' '}
                  <span className="text-foreground-lighter">
                    (~{formatCurrency(estimate.pipeline.monthly_cost)}/month)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-light">Streaming changes</span>
                <span className="font-mono text-foreground" translate="no">
                  {formatCurrency(estimate.streaming.rate_per_gb)}/GB
                </span>
              </div>
              <p className="text-xs text-foreground-lighter">
                Streaming is billed on the volume of changes replicated after the initial copy, so
                the total depends on how often your data changes.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border bg-surface-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Estimated first month total</p>
                <p className="text-xs text-foreground-lighter">
                  Initial copy + first pipeline fee, excluding usage-based streaming
                </p>
              </div>
              <span className="font-mono text-lg font-semibold text-foreground" translate="no">
                {formatCurrency(firstMonthTotal)}
              </span>
            </div>

            {hasRowFilteredTables ? (
              <p className="text-xs text-foreground-lighter">
                Some of these tables only replicate part of their data, so actual costs may be lower
                than shown.
              </p>
            ) : null}
          </DialogSection>
        ) : null}

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
