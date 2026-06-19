import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { Admonition } from 'ui-patterns'

import { setTableMode } from './warehouseDemoStore'

export type EnablementVariant = 'move' | 'attach'

interface WarehouseEnablementModalProps {
  open: boolean
  variant: EnablementVariant
  tableKey: string
  tableName: string
  onOpenChange: (open: boolean) => void
}

const MOVE_PROGRESS = ['Preparing', 'Copying', 'Cutover', 'Complete']
const ATTACH_PROGRESS = ['Creating copy', 'Initial sync', 'Live']

const MOVE_LIMITATIONS = [
  'Triggers may not work',
  'Foreign keys are not supported',
  'Traditional indexes are not available',
  'Row locks may not work as expected',
]

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isMove = variant === 'move'
  const progressLabels = isMove ? MOVE_PROGRESS : ATTACH_PROGRESS
  const intervalMs = isMove ? 1500 : 1200
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

    intervalRef.current = setInterval(() => {
      setProgressIndex((prev) => {
        const next = prev + 1
        if (next >= progressLabels.length) {
          clearInterval(intervalRef.current!)
          setTableMode(tableKey, isMove ? 'warehouse_backed' : 'has_warehouse_copy')
          toast.success(isMove ? 'Table moved to Warehouse' : 'Warehouse copy is live')
          onOpenChange(false)
          return prev
        }
        return next
      })
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, tableKey, isMove, progressLabels.length, intervalMs, onOpenChange])

  function handleConfirm() {
    setProgressIndex(0)
    setIsRunning(true)
  }

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
              ? 'Move analytical storage off the Postgres heap. Best for append-only tables like events and logs.'
              : 'Keep Postgres as the source of truth with a synced Warehouse copy for analytics.'}
          </DialogDescription>
        </DialogHeader>

        {isRunning ? (
          <DialogSection className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-foreground-light" />
            <p className="text-sm text-foreground">{progressLabels[progressIndex]}</p>
          </DialogSection>
        ) : (
          <>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-4">
              {!isMove && (
                <div className="rounded-md border bg-surface-75 divide-y text-sm">
                  <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="text-foreground-light">Table</span>
                    <code className="text-code-inline">{tableKey}</code>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="text-foreground-light">Warehouse copy</span>
                    <code className="text-code-inline">{warehouseCopyName}</code>
                  </div>
                </div>
              )}

              {isMove && (
                <>
                  <div className="rounded-md border bg-surface-75 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-foreground-light">Table</span>
                      <code className="text-code-inline">{tableKey}</code>
                    </div>
                  </div>
                  <Admonition type="warning" title="Heap storage will be replaced">
                    <ul className="list-disc space-y-1 pl-4 text-sm leading-normal!">
                      {MOVE_LIMITATIONS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Admonition>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      id="warehouse-move-ack"
                      checked={acknowledged}
                      onCheckedChange={(v) => setAcknowledged(Boolean(v))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground-light">
                      I understand this table will use Warehouse storage instead of the Postgres
                      heap.
                    </span>
                  </label>
                </>
              )}
            </DialogSection>
            <DialogFooter>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isMove && !acknowledged}>
                {isMove ? 'Move to Warehouse' : 'Copy to Warehouse'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
