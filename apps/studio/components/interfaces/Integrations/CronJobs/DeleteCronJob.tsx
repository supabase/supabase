import { toast } from 'sonner'

import { TelemetryActions } from 'common/telemetry-constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseCronJobDeleteMutation } from 'data/database-cron-jobs/database-cron-jobs-delete-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

interface DeleteCronJobProps {
  cronJob: CronJob
  visible: boolean
  onClose: () => void
}

export const DeleteCronJob = ({ cronJob, visible, onClose }: DeleteCronJobProps) => {
  const { project } = useProjectContext()
  const org = useSelectedOrganization()

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: deleteDatabaseCronJob, isLoading } = useDatabaseCronJobDeleteMutation({
    onSuccess: () => {
      sendEvent({
        action: TelemetryActions.CRON_JOB_DELETED,
        groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
      toast.success(`Successfully removed cron job ${cronJob.jobname}`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project is required')

    deleteDatabaseCronJob({
      jobId: cronJob.jobid,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  if (!cronJob) {
    return null
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete this cron job"
      loading={isLoading}
      confirmLabel={`Delete cron job ${cronJob.jobname}`}
      confirmPlaceholder="Type in name of cron job"
      confirmString={cronJob.jobname ?? 'Unknown'}
      text={
        <>
          <span>This will delete the cron job</span>{' '}
          <span className="text-bold text-foreground">{cronJob.jobname}</span>
        </>
      }
      alert={{ title: 'You cannot recover this cron job once deleted.' }}
    />
  )
}
