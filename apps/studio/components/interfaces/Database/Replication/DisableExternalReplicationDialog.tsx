import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

import { useDeleteReplicationTenantMutation } from '@/data/replication/delete-tenant-mutation'

interface DisableExternalReplicationDialogProps {
  projectRef: string
  tenantId: string
  visible: boolean
  onOpenChange: (open: boolean) => void
}

export const DisableExternalReplicationDialog = ({
  projectRef,
  tenantId,
  visible,
  onOpenChange,
}: DisableExternalReplicationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { mutateAsync: deleteReplicationTenant } = useDeleteReplicationTenantMutation({
    onSuccess: () => {
      toast.success('External replication has been disabled')
      onOpenChange(false)
    },
  })

  const onConfirm = async () => {
    setIsSubmitting(true)

    try {
      await deleteReplicationTenant({ projectRef, tenantId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={visible} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Disable external replication?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                Disable external replication if you no longer plan to send database changes to
                external destinations.
              </p>
              <p>
                This removes the <code>etl</code> schema and connected resources that are required
                for external replication to work.
              </p>
              <p>Read replicas are not affected.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" asChild>
            <Button
              type="danger"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
            >
              Disable external replication
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
