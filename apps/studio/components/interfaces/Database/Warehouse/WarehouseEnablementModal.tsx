import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { setTableMode } from './warehouseDemoStore'
import { WarehouseProgressSteps } from './WarehouseProgressSteps'

export type EnablementVariant = 'move' | 'attach'

interface WarehouseEnablementModalProps {
  open: boolean
  variant: EnablementVariant
  tableKey: string
  tableName: string
  onOpenChange: (open: boolean) => void
}

const MOVE_PROGRESS = ['Preparing', 'Copying data', 'Switching over']
const ATTACH_PROGRESS = ['Creating copy', 'Running initial sync']

// What a warehouse-backed table gives up vs. the Postgres heap. Parallel phrasing
// keeps the list scannable.
const MOVE_TRADE_OFFS = ['Triggers and row locks', 'Foreign key enforcement', 'Traditional indexes']

const STEP_INTERVAL_MS = 1300
// Beat after the last step checks off, so the completed state is visible.
const COMPLETION_HOLD_MS = 650

export function WarehouseEnablementModal({
  open,
  variant,
  tableKey,
  tableName,
  onOpenChange,
}: WarehouseEnablementModalProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)
  const [acknowledged, setAcknowledged] = useState(false)

  const isMove = variant === 'move'
  const steps = isMove ? MOVE_PROGRESS : ATTACH_PROGRESS
  const warehouseCopyName = `warehouse.${tableName}`

  useEffect(() => {
    if (!open) {
      setIsRunning(false)
      setProgressIndex(0)
      setAcknowledged(false)
    }
  }, [open])

  useEffect(() => {
    if (!isRunning) return

    // All steps checked off — hold briefly so the user sees the completed
    // checklist, then commit and close together. Committing is deferred into the
    // timeout (rather than fired now) so the store mutation doesn't re-render the
    // parent mid-hold and re-enter this effect.
    if (progressIndex >= steps.length) {
      const timeout = setTimeout(() => {
        setTableMode(tableKey, isMove ? 'warehouse_backed' : 'has_warehouse_copy')
        toast.success(isMove ? 'Table moved to Warehouse' : 'Warehouse copy is live')
        onOpenChange(false)
      }, COMPLETION_HOLD_MS)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => setProgressIndex((index) => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timeout)
  }, [isRunning, progressIndex, steps.length, tableKey, isMove, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && !isRunning) onOpenChange(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isMove ? 'Move to Warehouse' : 'Create Warehouse copy'}</DialogTitle>
          <DialogDescription>
            {isMove
              ? 'Relocate this table’s storage to Warehouse. Best for large, append-only tables like events or logs.'
              : 'Keep Postgres as the source of truth and sync a Warehouse copy for analytics.'}
          </DialogDescription>
        </DialogHeader>

        {isRunning ? (
          <DialogSection className="py-5">
            <WarehouseProgressSteps steps={steps} activeIndex={progressIndex} />
          </DialogSection>
        ) : (
          <>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-5">
              <div className="rounded-md border bg-surface-75 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-foreground-lighter">Table</span>
                  <code className="text-code-inline">{tableKey}</code>
                </div>
                {!isMove && (
                  <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5">
                    <span className="text-foreground-lighter">Warehouse copy</span>
                    <code className="text-code-inline">{warehouseCopyName}</code>
                  </div>
                )}
              </div>

              {isMove && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-foreground">
                      Once moved, this table no longer supports:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {MOVE_TRADE_OFFS.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-foreground-light"
                        >
                          <span className="size-1 shrink-0 rounded-full bg-foreground-muted" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-warning-400 bg-warning-200 px-4 py-3">
                    <Checkbox
                      id="warehouse-move-ack"
                      checked={acknowledged}
                      onCheckedChange={(val) => setAcknowledged(Boolean(val))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground">
                      <span className="font-medium">This can’t be undone.</span> The Postgres copy
                      is dropped once the move completes.
                    </span>
                  </label>
                </>
              )}
            </DialogSection>
            <DialogFooter>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setProgressIndex(0)
                  setIsRunning(true)
                }}
                disabled={isMove && !acknowledged}
              >
                {isMove ? 'Move to Warehouse' : 'Create copy'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
