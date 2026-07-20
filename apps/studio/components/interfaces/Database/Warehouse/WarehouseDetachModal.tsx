import { useParams } from 'common'
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

import { WarehouseProgressSteps } from './WarehouseProgressSteps'
import { useWarehouseDetachTableMutation } from '@/data/warehouse/detach-table-mutation'

const DETACH_PROGRESS = ['Stopping sync', 'Deleting copy']
const STEP_INTERVAL_MS = 1200

interface WarehouseDetachModalProps {
  open: boolean
  schema: string
  name: string
  copyName: string
  onOpenChange: (open: boolean) => void
}

export function WarehouseDetachModal({
  open,
  schema,
  name,
  copyName,
  onOpenChange,
}: WarehouseDetachModalProps) {
  const { ref: projectRef } = useParams()
  const [progressIndex, setProgressIndex] = useState(0)
  const hasStartedRef = useRef(false)

  const { mutate: detachTable, isPending } = useWarehouseDetachTableMutation({
    onSuccess: () => {
      toast.success('Warehouse copy detached')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to detach Warehouse copy: ${error.message}`)
      onOpenChange(false)
    },
  })

  // Kick off the detach exactly once when the dialog opens.
  useEffect(() => {
    if (!open) {
      hasStartedRef.current = false
      setProgressIndex(0)
      return
    }
    if (!hasStartedRef.current && projectRef) {
      hasStartedRef.current = true
      detachTable({ projectRef, schema, name })
    }
  }, [open, projectRef, schema, name, detachTable])

  // Cosmetic checklist progression while the request is in flight.
  useEffect(() => {
    if (!isPending || progressIndex >= DETACH_PROGRESS.length - 1) return
    const timeout = setTimeout(() => setProgressIndex((index) => index + 1), STEP_INTERVAL_MS)
    return () => clearTimeout(timeout)
  }, [isPending, progressIndex])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>Detaching Warehouse copy</DialogTitle>
          <DialogDescription>
            Deleting the Warehouse copy <code className="text-code-inline">{copyName}</code>. Your
            data in Postgres is unaffected.
          </DialogDescription>
        </DialogHeader>
        <DialogSection>
          <WarehouseProgressSteps
            steps={DETACH_PROGRESS}
            activeIndex={progressIndex}
            showProgressHeader
          />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
