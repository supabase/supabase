import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useDatabaseCronJobDeleteMutation } from 'data/database-cron-jobs/database-cron-jobs-delete-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cleanPointerEventsNoneOnBody } from 'lib/helpers'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useCronJobsData } from './CronJobsTab.useCronJobsData'

export const DeleteCronJob = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [cronJobIdForDeletion, setCronJobForDeletion] = useQueryState('delete', parseAsString)

  const { grid } = useCronJobsData({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    searchQuery,
  })
  const cronJob = grid.rows.find((j) => j.jobid.toString() === cronJobIdForDeletion)

  const { mutate: sendEvent } = useSendEventMutation()
  const {
    mutate: deleteDatabaseCronJob,
    isPending,
    isSuccess: isSuccessDelete,
  } = useDatabaseCronJobDeleteMutation({
    onSuccess: () => {
      sendEvent({
        action: 'cron_job_removed',
        groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })
      toast.success(`Successfully removed cron job`)
      setCronJobForDeletion(null)
    },
  })

  async function handleDelete() {
    if (!project) return console.error('Project is required')
    if (!cronJob) return console.error('Cron job is missing')

    deleteDatabaseCronJob({
      jobId: cronJob.jobid,
      projectRef: project.ref,
      connectionString: project.connectionString,
      searchTerm: searchQuery,
    })
  }

  useEffect(() => {
    if (grid.isSuccess && !!cronJobIdForDeletion && !cronJob && !isSuccessDelete) {
      toast('Cron job not found')
      setCronJobForDeletion(null)
    }
  }, [cronJob, cronJobIdForDeletion, grid.isSuccess, isSuccessDelete, setCronJobForDeletion])

  if (!cronJob) {
    return null
  }

  // Cron job name is optional. If the cron job has no name, show a simplified modal which doesn't require the user to input the name.
  if (!cronJob.jobname) {
    return (
      <ConfirmationModal
        variant="destructive"
        visible={!!cronJob}
        onCancel={() => {
          setCronJobForDeletion(null)
          cleanPointerEventsNoneOnBody()
        }}
        onConfirm={handleDelete}
        title={`Delete the cron job`}
        loading={isPending}
        confirmLabel={`Delete`}
        alert={{ title: 'You cannot recover this cron job once deleted.' }}
      />
    )
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={!!cronJob}
      onConfirm={handleDelete}
      onCancel={() => {
        setCronJobForDeletion(null)
        cleanPointerEventsNoneOnBody()
      }}
      title="Delete this cron job"
      loading={isPending}
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
