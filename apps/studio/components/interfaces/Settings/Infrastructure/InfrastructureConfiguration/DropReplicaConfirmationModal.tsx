import { useParams } from 'common'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertTriangle,
  Modal,
} from 'ui'

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
  const { mutateAsync: removeReadReplica } = useReadReplicaRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully removed read replica (ID: ${formattedId})`)
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
      danger
      size="medium"
      visible={selectedReplica !== undefined}
      header={`Confirm to drop selected replica? (ID: ${formattedId})`}
      buttonLabel="Drop replica"
      buttonLoadingLabel="Dropping replica"
      onSelectCancel={() => onCancel()}
      onSelectConfirm={() => onConfirmRemove()}
    >
      <Modal.Content className="py-3">
        <Alert_Shadcn_ variant="warning">
          <IconAlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            You may still deploy a new replica in this region thereafter
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
        <div className="text-sm px-1 pt-4">
          <p>Before deleting this replica, consider:</p>
          <ul className="text-foreground-light py-1 list-disc mx-4 space-y-1">
            <li>
              Network traffic from this region may slow down, especially if you have no other
              replicas in this region
            </li>
          </ul>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}

export default DropReplicaConfirmationModal
