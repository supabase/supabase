import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

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
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: deleteReplicationTenant, isPending: isSubmitting } =
    useDeleteReplicationTenantMutation({
      onSuccess: () => {
        toast.success('External replication has been disabled')
        setOpen(false)
      },
      onError: () => {},
    })

  const onConfirm = async () => {
    setError(null)

    try {
      if (!projectRef) throw new Error('Project ref is required')
      await deleteReplicationTenant({ projectRef })
    } catch (error: any) {
      setError(error.message ?? 'An unknown error occurred')
      throw error
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !isSubmitting && setOpen(open)}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Disable external replication</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm">
            <p>
              This will remove the <code className="text-code-inline">etl</code> schema and all
              connected resources from your database. Any active pipelines sending changes to
              external destinations will stop.
            </p>
            <p>Read replicas are not affected.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <Admonition
              type="destructive"
              title="Unable to disable external replication"
              description={error}
            />
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" loading={isSubmitting} onClick={onConfirm}>
            Disable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
