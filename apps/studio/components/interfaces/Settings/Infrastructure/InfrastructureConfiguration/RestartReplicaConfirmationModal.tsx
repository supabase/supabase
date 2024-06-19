import toast from 'react-hot-toast'

import { useProjectRestartMutation } from 'data/projects/project-restart-mutation'
import { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useParams } from 'common'
import { useQueryClient } from '@tanstack/react-query'
import { replicaKeys } from 'data/read-replicas/keys'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'

interface RestartReplicaConfirmationModalProps {
  selectedReplica?: Database
  onSuccess: () => void
  onCancel: () => void
}

export const RestartReplicaConfirmationModal = ({
  selectedReplica,
  onSuccess,
  onCancel,
}: RestartReplicaConfirmationModalProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const formattedId = formatDatabaseID(selectedReplica?.identifier ?? '')

  const { mutate: restartProject, isLoading: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      toast.success(`Restarting read replica (ID: ${formattedId})`)

      // [Joshen] Temporarily optimistic rendering until API supports immediate status update
      queryClient.setQueriesData<any>(replicaKeys.list(ref), (old: Database[]) => {
        const updatedReplicas = old.map((x) => {
          if (x.identifier === selectedReplica?.identifier) {
            return { ...x, status: REPLICA_STATUS.RESTORING }
          } else {
            return x
          }
        })
        return updatedReplicas
      })

      onSuccess()
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to restart replica: ${error.message}`)
    },
  })

  const onConfirmRestartReplica = () => {
    if (!ref) return console.error('Project is required')
    if (selectedReplica === undefined) return toast.error('No replica selected')
    restartProject({ ref, identifier: selectedReplica.identifier })
  }

  return (
    <ConfirmationModal
      size="medium"
      loading={isRestartingProject}
      visible={selectedReplica !== undefined}
      title={`Confirm to restart selected replica? (ID: ${formattedId})`}
      confirmLabel="Restart replica"
      confirmLabelLoading="Restarting replica"
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRestartReplica()}
    >
      <p className="text-sm">
        Your replica will be offline for a few minutes while it is being restarted. Before
        restarting the replica, consider:
      </p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        <li>
          Network traffic from this region may slow down while the replica is restarting, especially
          if you have no other replicas in this region
        </li>
      </ul>
      <p className="text-sm mt-2">Are you sure you want to restart this replica now?</p>
    </ConfirmationModal>
  )
}
