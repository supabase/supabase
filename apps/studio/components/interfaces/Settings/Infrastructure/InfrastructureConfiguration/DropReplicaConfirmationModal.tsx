import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicaKeys } from '@/data/read-replicas/keys'
import { useParams } from 'common'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import type { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'

interface DropReplicaConfirmationModalProps {
  selectedReplica?: Database
  onSuccess: () => void
  onCancel: () => void
}

export const DropReplicaConfirmationModal = ({
  selectedReplica,
  onSuccess,
  onCancel,
}: DropReplicaConfirmationModalProps) => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const formattedId = formatDatabaseID(selectedReplica?.identifier ?? '')
  const { mutate: removeReadReplica, isPending: isRemoving } = useReadReplicaRemoveMutation({
    onSuccess: () => {
      toast.success(`Tearing down read replica (ID: ${formattedId})`)

      // [Joshen] Temporarily optimistic rendering until API supports immediate status update
      queryClient.setQueriesData(
        { queryKey: replicaKeys.list(projectRef) },
        (old: Database[] | undefined) => {
          const updatedReplicas = old?.map((x) => {
            if (x.identifier === selectedReplica?.identifier) {
              return { ...x, status: REPLICA_STATUS.GOING_DOWN }
            }
            return x
          })
          return updatedReplicas
        }
      )

      onSuccess()
      onCancel()
    },
  })

  const onConfirmRemove = async () => {
    if (!projectRef) return console.error('Project is required')
    if (selectedReplica === undefined) return toast.error('No replica selected')

    removeReadReplica({
      projectRef,
      identifier: selectedReplica.identifier,
      invalidateReplicaQueries: true,
    })
  }

  return (
    <ConfirmationModal
      variant="destructive"
      size="medium"
      loading={isRemoving}
      visible={selectedReplica !== undefined}
      title={`Confirm to drop selected replica? (ID: ${formattedId})`}
      confirmLabel="Drop replica"
      confirmLabelLoading="Dropping replica"
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRemove()}
      alert={{
        title: 'This action cannot be undone',
        description: 'You may still deploy a new replica in this region thereafter',
      }}
    >
      <p className="text-sm">Before deleting this replica, consider:</p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        <li>
          Network traffic from this region may slow down, especially if you have no other replicas
          in this region
        </li>
      </ul>
    </ConfirmationModal>
  )
}
