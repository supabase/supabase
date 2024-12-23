import { toString as CronToString } from 'cronstrue'
import { useState } from 'react'
import { History, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import Table from 'components/to-be-cleaned/Table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Switch,
} from 'ui'
import { TelemetryActions } from 'lib/constants/telemetry'

interface CronJobRowProps {
  job: CronJob
  onEditCronJob: (job: CronJob) => void
  onDeleteCronJob: (job: CronJob) => void
}

export const CronJobRow = ({ job, onEditCronJob, onDeleteCronJob }: CronJobRowProps) => {
  const { ref } = useParams()
  const { project: selectedProject } = useProjectContext()

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: toggleDatabaseCronJob, isLoading } = useDatabaseCronJobToggleMutation()

  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws
  let schedule = job.schedule
  try {
    const scheduleString = CronToString(job.schedule)
    schedule = scheduleString
  } catch {}

  return (
    <>
      <Table.tr>
        <Table.td>{job.jobname}</Table.td>
        <Table.td>{schedule}</Table.td>
        <Table.td className="font-mono">{job.command.trim()}</Table.td>
        <Table.td>Hello</Table.td>
        <Table.td>Hello</Table.td>
        <Table.td>
          <Switch
            id={`cron-job-active-${job.jobid}`}
            size="large"
            disabled={isLoading}
            checked={job.active}
            onCheckedChange={() => setShowConfirmModal(true)}
          />
        </Table.td>
        <Table.td>
          <div className="flex items-center gap-x-2">
            <Button
              asChild
              type="default"
              icon={<History />}
              onClick={() => {
                sendEvent({
                  action: TelemetryActions.CRON_JOB_HISTORY_CLICKED,
                })
              }}
            >
              <Link href={`/project/${ref}/integrations/cron/jobs/${job.jobname}`}>History</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" icon={<MoreVertical />} className="px-1.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    sendEvent({
                      action: TelemetryActions.CRON_JOB_UPDATE_CLICKED,
                    })
                    onEditCronJob(job)
                  }}
                >
                  Edit cron job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    sendEvent({
                      action: TelemetryActions.CRON_JOB_DELETE_CLICKED,
                    })
                    onDeleteCronJob(job)
                  }}
                >
                  Delete cron job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Table.td>
      </Table.tr>

      <ConfirmationModal
        visible={showConfirmModal}
        title={job.active ? 'Disable cron job' : 'Enable cron job'}
        loading={isLoading}
        confirmLabel={job.active ? 'Disable' : 'Enable'}
        onCancel={() => setShowConfirmModal(false)}
        variant={job.active ? 'destructive' : undefined}
        onConfirm={() => {
          toggleDatabaseCronJob({
            projectRef: selectedProject?.ref!,
            connectionString: selectedProject?.connectionString,
            jobId: job.jobid,
            active: !job.active,
          })
          setShowConfirmModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          <span>{`Are you sure you want to ${job.active ? 'disable' : 'enable'} the`}</span>{' '}
          <span className="font-bold">{`${job?.jobname}`}</span>
          <span> cron job?</span>
        </p>
      </ConfirmationModal>
    </>
  )
}
