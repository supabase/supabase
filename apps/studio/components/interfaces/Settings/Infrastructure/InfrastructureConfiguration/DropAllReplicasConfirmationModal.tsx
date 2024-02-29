import { useParams } from 'common'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertTriangle,
  Modal,
} from 'ui'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useQueryClient } from '@tanstack/react-query'
import { replicaKeys } from 'data/read-replicas/keys'

interface DropAllReplicasConfirmationModalProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
}

const DropAllReplicasConfirmationModal = ({
  visible,
  onSuccess,
  onCancel,
}: DropAllReplicasConfirmationModalProps) => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const { mutateAsync: removeReadReplica, isLoading: isRemoving } = useReadReplicaRemoveMutation()

  const onConfirmRemove = async () => {
    if (!projectRef) return console.error('Project is required')
    if (databases === undefined) return console.error('Unable to retrieve replicas')
    if (databases.length === 1) toast('Your project has no read replicas')

    const replicas = databases.filter((db) => db.identifier !== projectRef)
    await Promise.all(
      replicas.map((db) =>
        removeReadReplica({ projectRef, identifier: db.identifier, skipInvalidateOnSuccess: true })
      )
    )
    toast.success(`Tearing down all read replicas`)

    queryClient.setQueriesData<any>(replicaKeys.list(projectRef), (old: Database[]) => {
      return old.filter((db: Database) => db.identifier === projectRef)
    })
    queryClient.setQueriesData<any>(replicaKeys.loadBalancers(projectRef), (old: Database[]) => [])

    setTimeout(async () => {
      await queryClient.invalidateQueries(replicaKeys.list(projectRef))
      await queryClient.invalidateQueries(replicaKeys.loadBalancers(projectRef))
    }, 5000)

    onSuccess()
    onCancel()
  }

  return (
    <ConfirmationModal
      danger
      size="medium"
      loading={isRemoving}
      visible={visible}
      header="Confirm to drop all read replicas?"
      buttonLabel="Drop all replicas"
      buttonLoadingLabel="Dropping all replicas"
      onSelectCancel={() => onCancel()}
      onSelectConfirm={() => onConfirmRemove()}
    >
      <Modal.Content className="py-3">
        <Alert_Shadcn_ variant="warning">
          <IconAlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            You may still deploy new replicas in this region thereafter
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
        <div className="text-sm px-1 pt-4">
          <p>Before deleting all replicas, consider:</p>
          <ul className="text-foreground-light py-1 list-disc mx-4 space-y-1">
            <li>Network traffic from this region may slow down</li>
          </ul>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}

export default DropAllReplicasConfirmationModal
