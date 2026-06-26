import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { setTableMode } from './warehouseDemoStore'
import { WarehouseProgressSteps } from './WarehouseProgressSteps'

interface WarehouseEnablementModalProps {
  open: boolean
  tableKey: string
  tableName: string
  onOpenChange: (open: boolean) => void
}

const ATTACH_PROGRESS = ['Creating copy', 'Running initial sync']

const STEP_INTERVAL_MS = 1300
// Beat after the last step checks off, so the completed state is visible.
const COMPLETION_HOLD_MS = 650

export function WarehouseEnablementModal({
  open,
  tableKey,
  tableName,
  onOpenChange,
}: WarehouseEnablementModalProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)

  const warehouseCopyName = `warehouse.${tableName}`

  useEffect(() => {
    if (!open) {
      setIsRunning(false)
      setProgressIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!isRunning) return

    if (progressIndex >= ATTACH_PROGRESS.length) {
      const timeout = setTimeout(() => {
        setTableMode(tableKey, 'has_warehouse_copy')
        toast.success('Warehouse copy is live')
        onOpenChange(false)
      }, COMPLETION_HOLD_MS)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => setProgressIndex((index) => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timeout)
  }, [isRunning, progressIndex, tableKey, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && !isRunning) onOpenChange(false)
      }}
    >
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Create Warehouse copy</DialogTitle>
        </DialogHeader>

        {isRunning ? (
          <DialogSection>
            <WarehouseProgressSteps steps={ATTACH_PROGRESS} activeIndex={progressIndex} />
          </DialogSection>
        ) : (
          <>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-4">
              <p className="text-sm text-foreground-light">
                The Postgres heap will remain the source of truth. Changes in Postgres will
                continuously sync to a Warehouse copy.
              </p>

              <div className="rounded-lg border bg-surface-75 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-foreground-lighter">Postgres</span>
                  <code className="text-code-inline">{tableKey}</code>
                </div>
                <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-lighter">Warehouse</span>
                    <Badge variant="success">New</Badge>
                  </div>
                  <code className="text-code-inline">{warehouseCopyName}</code>
                </div>
              </div>
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
              >
                Create copy
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
