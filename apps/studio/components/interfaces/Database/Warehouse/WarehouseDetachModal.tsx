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

import { clearTableMode } from './warehouseDemoStore'

const DETACH_PROGRESS = ['Disconnecting sync', 'Dropping copy', 'Complete']
const STEP_INTERVAL_MS = 1200

interface WarehouseDetachModalProps {
  open: boolean
  tableKey: string
  copyName: string
  onOpenChange: (open: boolean) => void
}

export function WarehouseDetachModal({
  open,
  tableKey,
  copyName,
  onOpenChange,
}: WarehouseDetachModalProps) {
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
        if (next >= DETACH_PROGRESS.length) {
          clearInterval(intervalRef.current!)
          clearTableMode(tableKey)
          toast.success('Warehouse copy detached')
          onOpenChange(false)
          return prev
        }
        return next
      })
    }, STEP_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, tableKey, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detach Warehouse copy</DialogTitle>
          <DialogDescription>
            Removing <code className="text-code-inline">{copyName}</code>. The Postgres source table
            is not affected.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-foreground-light" />
          <p className="text-sm text-foreground">{DETACH_PROGRESS[progressIndex]}</p>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
