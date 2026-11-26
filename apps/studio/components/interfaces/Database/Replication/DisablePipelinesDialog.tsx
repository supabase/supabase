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

import { classifyError } from '@/data/error-classification'
import { useDeleteReplicationTenantMutation } from '@/data/replication/delete-tenant-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'

interface DisablePipelinesDialogProps {
  open: boolean
  setOpen: (value: boolean) => void
  clusterIds?: (string | undefined)[]
  canConfirm?: boolean
}

type DisableFailure = {
  clusterIds: (string | undefined)[]
  hasPartialSuccess: boolean
  error: StudioError
}

export const DisablePipelinesDialog = ({
  open,
  setOpen,
  clusterIds,
  canConfirm = true,
}: DisablePipelinesDialogProps) => {
  const { ref: projectRef } = useParams()
  const [failure, setFailure] = useState<DisableFailure | null>(null)
  const { mutateAsync: deleteReplicationTenant } = useDeleteReplicationTenantMutation({
    onError: () => {},
  })

  const onConfirm = async () => {
    if (!canConfirm) throw new Error('Pipeline regions could not be verified')
    const targetClusterIds = failure?.clusterIds ?? clusterIds ?? [undefined]

    if (!projectRef) {
      const error = classifyError(new Error('Project ref is required'))
      setFailure({ clusterIds: targetClusterIds, hasPartialSuccess: false, error })
      throw error
    }

    const failedClusterIds: (string | undefined)[] = []
    let firstError: StudioError | undefined
    // Regional tenants share the same source database. Delete them in sequence to avoid concurrent schema removal.
    for (const targetClusterId of targetClusterIds) {
      try {
        await deleteReplicationTenant({ projectRef, clusterId: targetClusterId })
      } catch (error) {
        failedClusterIds.push(targetClusterId)
        firstError ??= classifyError(error)
      }
    }

    if (firstError) {
      setFailure({
        clusterIds: failedClusterIds,
        hasPartialSuccess:
          failure?.hasPartialSuccess === true || failedClusterIds.length < targetClusterIds.length,
        error: firstError,
      })
      throw firstError
    }

    toast.success('Pipelines has been disabled')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setFailure(null)
    setOpen(nextOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Pipelines</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the etl schema and all Pipelines-managed resources from your database. Data
            already at destinations is kept. Read replicas are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!canConfirm && (
          <AlertDialogBody>
            <Admonition
              type="destructive"
              title="Unable to verify every region"
              description="Close this dialog and check the regional pipeline status before trying again."
            />
          </AlertDialogBody>
        )}
        {failure && (
          <AlertDialogBody>
            <Admonition
              type="destructive"
              title={
                failure.hasPartialSuccess
                  ? 'Pipelines disabled in some regions'
                  : 'Unable to disable Pipelines'
              }
              description={failure.error.message}
            />
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" disabled={!canConfirm} onClick={onConfirm}>
            {failure ? 'Retry' : 'Disable Pipelines'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
