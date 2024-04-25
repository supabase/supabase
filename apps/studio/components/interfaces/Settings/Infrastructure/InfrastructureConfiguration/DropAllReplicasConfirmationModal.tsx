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
      variant={'destructive'}
      size="medium"
      loading={isRemoving}
      visible={visible}
      title="Confirm to drop all read replicas?"
      confirmLabel="Drop all replicas"
      confirmLabelLoading="Dropping all replicas"
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRemove()}
      alert={{
        title: 'This action cannot be undone',
        description: 'You may still deploy new replicas in this region thereafter',
      }}
    >
      <p className="text-sm">Before deleting all replicas, consider:</p>
      <ul className="text-sm text-foreground-light list-disc">
        <li>Network traffic from this region may slow down</li>
      </ul>
    </ConfirmationModal>
  )
}

export default DropAllReplicasConfirmationModal
