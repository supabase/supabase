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
import type { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'

interface DropReplicaConfirmationModalProps {
  selectedReplica?: Database
  onSuccess: () => void
  onCancel: () => void
}

const DropReplicaConfirmationModal = ({
  selectedReplica,
  onSuccess,
  onCancel,
}: DropReplicaConfirmationModalProps) => {
  const { ref: projectRef } = useParams()
  const formattedId = formatDatabaseID(selectedReplica?.identifier ?? '')
  const { mutateAsync: removeReadReplica, isLoading: isRemoving } = useReadReplicaRemoveMutation({
    onSuccess: () => {
      toast.success(`Tearing down read replica (ID: ${formattedId})`)
      onSuccess()
      onCancel()
    },
  })

  const onConfirmRemove = async () => {
    if (!projectRef) return console.error('Project is required')
    if (selectedReplica === undefined) return toast.error('No replica selected')

    await removeReadReplica({ projectRef, identifier: selectedReplica.identifier })
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

export default DropReplicaConfirmationModal
