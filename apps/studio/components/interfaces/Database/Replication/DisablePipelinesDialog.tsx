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
import { Admonition } from 'ui-patterns/Admonition'

import { useDeleteReplicationTenantMutation } from '@/data/replication/delete-tenant-mutation'

interface DisablePipelinesDialogProps {
  open: boolean
  setOpen: (value: boolean) => void
}

export const DisablePipelinesDialog = ({ open, setOpen }: DisablePipelinesDialogProps) => {
  const { ref: projectRef } = useParams()
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: deleteReplicationTenant, isPending: isSubmitting } =
    useDeleteReplicationTenantMutation({
      onSuccess: () => {
        toast.success('Pipelines has been disabled')
        setOpen(false)
      },
      onError: () => {},
    })

  const onConfirm = async () => {
    setError(null)

    try {
      if (!projectRef) throw new Error('Project ref is required')
      await deleteReplicationTenant({ projectRef })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while disabling Pipelines'
      )
      throw error
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !isSubmitting && setOpen(open)}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Pipelines</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-y-2 text-sm">
            <span>
              This will remove the <code className="text-code-inline">etl</code> schema and all
              Pipelines-managed resources from your database. Data already written to destination
              systems is not deleted.
            </span>
            <span>Read replicas are not affected.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <Admonition
              type="destructive"
              title="Unable to disable Pipelines"
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
