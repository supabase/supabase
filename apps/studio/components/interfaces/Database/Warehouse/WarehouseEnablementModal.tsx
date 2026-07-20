import { useParams } from 'common'
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

import { getWarehouseQualifiedTableName } from './warehouseNaming.utils'
import { WarehouseProgressSteps } from './WarehouseProgressSteps'
import { useWarehouseLinkTableMutation } from '@/data/warehouse/link-table-mutation'

interface WarehouseEnablementModalProps {
  open: boolean
  schema: string
  name: string
  onOpenChange: (open: boolean) => void
}

const ATTACH_PROGRESS = ['Creating copy', 'Starting sync']
const STEP_INTERVAL_MS = 1300

export function WarehouseEnablementModal({
  open,
  schema,
  name,
  onOpenChange,
}: WarehouseEnablementModalProps) {
  const { ref: projectRef } = useParams()
  const [progressIndex, setProgressIndex] = useState(0)

  const tableKey = `${schema}.${name}`
  const warehouseQualifiedName = getWarehouseQualifiedTableName(tableKey)

  const { mutate: linkTable, isPending: isRunning } = useWarehouseLinkTableMutation({
    onSuccess: () => {
      // Setup is async — the request is accepted (202) and the copy finishes syncing in the
      // background. The table's storage panel polls its status until it goes live.
      toast.success('Warehouse copy started — syncing in the background')
      onOpenChange(false)
    },
  })

  // Reset the cosmetic checklist whenever the dialog closes.
  useEffect(() => {
    if (!open) setProgressIndex(0)
  }, [open])

  // Advance the checklist while the request is in flight; hold on the last step until it resolves.
  useEffect(() => {
    if (!isRunning || progressIndex >= ATTACH_PROGRESS.length - 1) return
    const timeout = setTimeout(() => setProgressIndex((index) => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timeout)
  }, [isRunning, progressIndex])

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
                The Postgres heap remains the source of truth for writes and the Table Editor. Query
                the Warehouse copy explicitly for analytical workloads.
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
                  <code className="text-code-inline">{warehouseQualifiedName}</code>
                </div>
              </div>
            </DialogSection>
            <DialogFooter>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!projectRef}
                onClick={() => {
                  if (!projectRef) return
                  setProgressIndex(0)
                  linkTable({ projectRef, schema, name })
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
