import { useParams } from 'common'
import toast from 'react-hot-toast'

import { useQueryClient } from '@tanstack/react-query'
import { replicaKeys } from 'data/read-replicas/keys'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

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
        removeReadReplica({
          projectRef,
          identifier: db.identifier,
          invalidateReplicaQueries: false,
        })
      )
    )
    toast.success(`Tearing down all read replicas`)

    await Promise.all([
      queryClient.invalidateQueries(replicaKeys.list(projectRef)),
      queryClient.invalidateQueries(replicaKeys.loadBalancers(projectRef)),
    ])

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
