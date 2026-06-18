import { Check, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

export type EnablementVariant = 'move' | 'attach'

interface WarehouseEnablementModalProps {
  open: boolean
  variant: EnablementVariant
  tableKey: string
  tableName: string
  onOpenChange: (open: boolean) => void
}

const MOVE_STEPS = ['Preparing', 'Copying', 'Cutover', 'Complete']
const ATTACH_STEPS = ['Creating copy', 'Initial sync', 'Live']

const MOVE_LIMITATIONS = [
  'Triggers may not fire on Warehouse-backed tables',
  'Foreign key constraints are not supported',
  'Row-level locks and traditional indexes are not available',
  'Some UPDATE / DELETE patterns may behave differently',
]

export function WarehouseEnablementModal({
  open,
  variant,
  tableKey,
  tableName,
  onOpenChange,
}: WarehouseEnablementModalProps) {
  // step: 0 = preflight/configure, 1 = progress, 2 = done
  const [step, setStep] = useState(0)
  const [progressIndex, setProgressIndex] = useState(0)
  const [checkedA, setCheckedA] = useState(false)
  const [checkedB, setCheckedB] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const progressSteps = variant === 'move' ? MOVE_STEPS : ATTACH_STEPS
  const intervalMs = variant === 'move' ? 1500 : 1200

  // Reset all state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(0)
      setProgressIndex(0)
      setCheckedA(false)
      setCheckedB(false)
    }
  }, [open])

  // Drive the progress animation when on step 1
  useEffect(() => {
    if (step !== 1) return

    intervalRef.current = setInterval(() => {
      setProgressIndex((prev) => {
        const next = prev + 1
        if (next >= progressSteps.length) {
          clearInterval(intervalRef.current!)
          // Update store and advance to done step
          setTableMode(tableKey, variant === 'move' ? 'warehouse_backed' : 'has_warehouse_copy')
          setStep(2)
          return prev
        }
        return next
      })
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [step, tableKey, variant, progressSteps.length, intervalMs])

  function handleConfirm() {
    setProgressIndex(0)
    setStep(1)
  }

  function handleClose() {
    onOpenChange(false)
  }

  const isMove = variant === 'move'
  const title = isMove ? 'Move to Warehouse' : 'Create Warehouse copy'

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && step !== 1) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isMove
              ? 'Best for append-only analytical tables (events, logs). Postgres heap storage is replaced.'
              : 'Best when Postgres remains source of truth. Reversible at any time.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 0: Preflight / Configure ── */}
        {step === 0 && (
          <>
            <DialogSection>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-foreground-light">
                  Table: <span className="font-mono text-foreground">{tableName}</span>
                </p>
                {!isMove && (
                  <p className="text-sm text-foreground-light">
                    Warehouse copy name:{' '}
                    <span className="font-mono text-foreground">{tableName}_wh</span>
                  </p>
                )}
                {!isMove && (
                  <p className="text-sm text-foreground-muted">
                    Estimated initial sync: ~2 minutes
                  </p>
                )}
              </div>
            </DialogSection>

            {isMove && (
              <>
                <DialogSectionSeparator />
                <DialogSection>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-warning">
                      Limitations — read before continuing
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {MOVE_LIMITATIONS.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-foreground-light"
                        >
                          <span className="mt-0.5 shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DialogSection>
                <DialogSectionSeparator />
                <DialogSection>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        id="warehouse-ack-a"
                        checked={checkedA}
                        onCheckedChange={(v) => setCheckedA(Boolean(v))}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground-light">
                        I understand this table will no longer use Postgres heap storage.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        id="warehouse-ack-b"
                        checked={checkedB}
                        onCheckedChange={(v) => setCheckedB(Boolean(v))}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground-light">
                        I have reviewed the limitations and confirmed this table has no blocking
                        triggers or foreign keys.
                      </span>
                    </label>
                  </div>
                </DialogSection>
              </>
            )}

            <DialogFooter>
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={isMove && (!checkedA || !checkedB)}
              >
                {isMove ? 'Move to Warehouse' : 'Create copy'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 1: Progress ── */}
        {step === 1 && (
          <>
            <DialogSection>
              <div className="flex flex-col gap-3 py-2">
                {progressSteps.map((label, i) => {
                  const isDone = i < progressIndex
                  const isActive = i === progressIndex
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {isDone ? (
                          <Check size={16} className="text-brand" />
                        ) : isActive ? (
                          <Loader2 size={16} className="animate-spin text-foreground-light" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-border" />
                        )}
                      </div>
                      <span
                        className={
                          isDone
                            ? 'text-sm text-foreground-light line-through'
                            : isActive
                              ? 'text-sm text-foreground font-medium'
                              : 'text-sm text-foreground-muted'
                        }
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </DialogSection>
            <DialogFooter>
              <Button variant="default" disabled>
                Please wait…
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Done ── */}
        {step === 2 && (
          <>
            <DialogSection>
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                  <Check size={20} className="text-brand" />
                </div>
                <p className="text-sm text-foreground font-medium">
                  {isMove ? 'Table moved to Warehouse' : 'Warehouse copy is live'}
                </p>
                <p className="text-sm text-foreground-light max-w-xs">
                  {isMove
                    ? `${tableName} is now Warehouse-backed. Analytical queries will be served by Warehouse automatically.`
                    : `A continuously-synced Warehouse copy of ${tableName} is now live. Postgres remains the source of truth.`}
                </p>
              </div>
            </DialogSection>
            <DialogFooter>
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
