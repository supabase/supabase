import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseCronjobDeleteMutation } from 'data/database-cronjobs/database-cronjobs-delete-mutation'
import { Cronjob } from 'data/database-cronjobs/database-cronjobs-query'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteCronjobProps {
  cronjob: Cronjob
  visible: boolean
  onClose: () => void
}

const DeleteCronjob = ({ cronjob, visible, onClose }: DeleteCronjobProps) => {
  const { project } = useProjectContext()

  const { mutate: deleteDatabaseCronjob, isLoading } = useDatabaseCronjobDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed cronjob ${cronjob.jobname}`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project is required')

    deleteDatabaseCronjob({
      jobId: cronjob.jobid,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  if (!cronjob) {
    return null
  }

  return (
    <TextConfirmModal
      variant="warning"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete this cronjob"
      loading={isLoading}
      confirmLabel={`Delete cronjob ${cronjob.jobname}`}
      confirmPlaceholder="Type in name of cronjob"
      confirmString={cronjob.jobname ?? 'Unknown'}
      text={
        <>
          <span>This will delete the cronjob</span>{' '}
          <span className="text-bold text-foreground">{cronjob.jobname}</span>
        </>
      }
      alert={{ title: 'You cannot recover this cronjob once deleted.' }}
    />
  )
}

export default DeleteCronjob
