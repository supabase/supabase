import { useParams } from 'common'
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
  open: boolean
  setOpen: (value: boolean) => void
}

export const DisableExternalReplicationDialog = ({
  open,
  setOpen,
}: DisableExternalReplicationDialogProps) => {
  const { ref: projectRef } = useParams()

  const { mutateAsync: deleteReplicationTenant, isPending: isSubmitting } =
    useDeleteReplicationTenantMutation({
      onSuccess: () => {
        toast.success('External replication has been disabled')
        setOpen(false)
      },
    })

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')
    await deleteReplicationTenant({ projectRef })
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !isSubmitting && setOpen(open)}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm to disable external replication</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm">
            <p>
              This will remove the <code className="text-code-inline">etl</code> schema and all
              connected resources from your database. Any active pipelines sending changes to
              external destinations will stop.
            </p>
            <p>Read replicas are not affected.</p>
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
