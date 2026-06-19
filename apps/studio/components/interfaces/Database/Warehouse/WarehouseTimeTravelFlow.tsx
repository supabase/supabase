import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { getWarehouseSnapshots, type WarehouseSnapshot } from './warehouseDemoStore'
import { WarehouseProgressSteps } from './WarehouseProgressSteps'
import {
  buildSnapshotQuerySql,
  formatSnapshotLabel,
  formatSnapshotSize,
} from './warehouseSnapshot.utils'

interface WarehouseTimeTravelFlowProps {
  tableKey: string
  sheetOpen: boolean
  onSheetOpenChange: (open: boolean) => void
}

const RESTORE_PROGRESS = ['Preparing restore', 'Applying snapshot']
const STEP_INTERVAL_MS = 1300
const COMPLETION_HOLD_MS = 650

type View = 'list' | 'confirm' | 'progress'

/**
 * Time-travel flow for a warehouse-backed table. The snapshot list, the restore
 * confirmation, and the restore progress are all steps within one Dialog (the
 * content swaps between them). Keeping it to a single surface makes the steps
 * feel unified, keeps the flow mounted through the whole sequence, and avoids
 * the modal-stacking races that separate dialogs ran into.
 */
export function WarehouseTimeTravelFlow({
  tableKey,
  sheetOpen,
  onSheetOpenChange,
}: WarehouseTimeTravelFlowProps) {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [view, setView] = useState<View>('list')
  const [target, setTarget] = useState<WarehouseSnapshot | null>(null)
  const [progressIndex, setProgressIndex] = useState(0)

  const snapshots = getWarehouseSnapshots(tableKey)

  // Always reopen on the list.
  useEffect(() => {
    if (sheetOpen) {
      setView('list')
      setTarget(null)
      setProgressIndex(0)
    }
  }, [sheetOpen])

  // Fake restore progress: advance the checklist, then hold on the completed
  // state before closing so the user sees it finish.
  useEffect(() => {
    if (view !== 'progress') return

    if (progressIndex >= RESTORE_PROGRESS.length) {
      const timeout = setTimeout(() => {
        toast.success('Table restored from snapshot')
        onSheetOpenChange(false)
      }, COMPLETION_HOLD_MS)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => setProgressIndex((index) => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timeout)
  }, [view, progressIndex, onSheetOpenChange])

  function handleQuery(snapshot: WarehouseSnapshot) {
    if (!projectRef) return
    const sql = buildSnapshotQuerySql(tableKey, snapshot)
    onSheetOpenChange(false)
    void router.push(`/project/${projectRef}/sql/new?content=${encodeURIComponent(sql)}`)
  }

  const isRestoring = view === 'progress'

  return (
    <Dialog
      open={sheetOpen}
      onOpenChange={(open) => {
        if (!open && !isRestoring) onSheetOpenChange(false)
      }}
    >
      <DialogContent size="medium" hideClose={isRestoring}>
        {view === 'list' && (
          <>
            <DialogHeader className="border-b">
              <DialogTitle>Snapshots</DialogTitle>
              <DialogDescription>
                Point-in-time snapshots for <code className="text-code-inline">{tableKey}</code>
              </DialogDescription>
            </DialogHeader>

            <Table containerProps={{ className: 'max-h-[55vh]' }}>
              <TableHeader>
                <TableRow>
                  <TableHead>Snapshot</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((snapshot, index) => {
                  const isLatest = index === 0
                  return (
                    <TableRow key={snapshot.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TimestampInfo
                            className="text-sm"
                            utcTimestamp={snapshot.createdAt}
                            displayAs="local"
                          />
                          {isLatest && <Badge variant="default">Latest</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground-light">
                        {formatSnapshotSize(snapshot)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="tiny"
                            variant="default"
                            onClick={() => handleQuery(snapshot)}
                          >
                            Query
                          </Button>
                          {isLatest ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                  <Button type="button" size="tiny" variant="outline" disabled>
                                    Restore
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">Already active</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              type="button"
                              size="tiny"
                              variant="outline"
                              onClick={() => {
                                setTarget(snapshot)
                                setView('confirm')
                              }}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}

        {view === 'confirm' && target && (
          <>
            <DialogHeader>
              <DialogTitle>Restore from snapshot</DialogTitle>
              <DialogDescription>
                Warehouse table <code className="text-code-inline">{tableKey}</code> will be
                restored to the following snapshot. The current data will be replaced. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogSection>
              <div className="divide-y rounded-md border bg-surface-75 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-foreground-lighter">Snapshot</span>
                  <div className="flex items-center gap-2">
                    <TimestampInfo
                      className="text-sm text-foreground"
                      utcTimestamp={target.createdAt}
                      displayAs="local"
                    />
                    {snapshots[0]?.id === target.id && <Badge variant="default">Latest</Badge>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-foreground-lighter">Size</span>
                  <span className="text-foreground">{formatSnapshotSize(target)}</span>
                </div>
              </div>
            </DialogSection>
            <DialogFooter>
              <Button type="button" variant="default" onClick={() => setView('list')}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="warning"
                onClick={() => {
                  setProgressIndex(0)
                  setView('progress')
                }}
              >
                Restore
              </Button>
            </DialogFooter>
          </>
        )}

        {view === 'progress' && target && (
          <>
            <DialogHeader>
              <DialogTitle>Restoring snapshot</DialogTitle>
              <DialogDescription>
                Restoring <code className="text-code-inline">{tableKey}</code> to{' '}
                <span className="text-foreground">{formatSnapshotLabel(target)}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogSection className="py-5">
              <WarehouseProgressSteps steps={RESTORE_PROGRESS} activeIndex={progressIndex} />
            </DialogSection>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
