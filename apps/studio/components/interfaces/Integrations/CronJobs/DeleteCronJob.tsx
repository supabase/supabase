import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseCronJobDeleteMutation } from 'data/database-cron-jobs/database-cron-jobs-delete-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TELEMETRY_EVENTS, TELEMETRY_VALUES } from 'lib/constants/telemetry'

interface DeleteCronJobProps {
  cronJob: CronJob
  visible: boolean
  onClose: () => void
}

export const DeleteCronJob = ({ cronJob, visible, onClose }: DeleteCronJobProps) => {
  const { project } = useProjectContext()

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: deleteDatabaseCronJob, isLoading } = useDatabaseCronJobDeleteMutation({
    onSuccess: () => {
      sendEvent({
        action: TELEMETRY_EVENTS.CRON_JOBS,
        value: TELEMETRY_VALUES.CRON_JOB_DELETED,
        label: 'User deleted cron job',
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
