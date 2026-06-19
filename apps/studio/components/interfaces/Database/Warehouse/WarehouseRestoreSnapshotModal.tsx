import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'

const RESTORE_PROGRESS = ['Preparing restore', 'Applying snapshot', 'Complete']
const STEP_INTERVAL_MS = 1200

interface WarehouseRestoreSnapshotModalProps {
  open: boolean
  tableKey: string
  snapshotLabel: string
  onOpenChange: (open: boolean) => void
}

export function WarehouseRestoreSnapshotModal({
  open,
  tableKey,
  snapshotLabel,
  onOpenChange,
}: WarehouseRestoreSnapshotModalProps) {
  const [progressIndex, setProgressIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) {
      setProgressIndex(0)
      return
    }

    intervalRef.current = setInterval(() => {
      setProgressIndex((prev) => {
        const next = prev + 1
        if (next >= RESTORE_PROGRESS.length) {
          clearInterval(intervalRef.current!)
          toast.success('Table restored from snapshot')
          onOpenChange(false)
          return prev
        }
        return next
      })
    }, STEP_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore from snapshot</DialogTitle>
          <DialogDescription>
            Restoring <code className="text-code-inline">{tableKey}</code> to{' '}
            <span className="text-foreground">{snapshotLabel}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-foreground-light" />
          <p className="text-sm text-foreground">{RESTORE_PROGRESS[progressIndex]}</p>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
