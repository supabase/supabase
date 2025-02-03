import dayjs from 'dayjs'
import { Clock, History, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { TelemetryActions } from 'common/telemetry-constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useCronJobRunQuery } from 'data/database-cron-jobs/database-cron-jobs-run-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import {
  Badge,
  Button,
  cn,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Switch,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { convertCronToString, getNextRun } from './CronJobs.utils'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

interface CronJobCardProps {
  job: CronJob
  onEditCronJob: (job: CronJob) => void
  onDeleteCronJob: (job: CronJob) => void
}

export const CronJobCard = ({ job, onEditCronJob, onDeleteCronJob }: CronJobCardProps) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()

  const [toggleConfirmationModalShown, showToggleConfirmationModal] = useState(false)

  const { data } = useCronJobRunQuery({
    projectRef: ref,
    connectionString: selectedProject?.connectionString,
    jobId: job.jobid,
  })
  const lastRun = data?.start_time ? dayjs(data.start_time).valueOf() : undefined
  const nextRun = getNextRun(job.schedule, data?.start_time)
  const schedule = convertCronToString(job.schedule)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: toggleDatabaseCronJob, isLoading } = useDatabaseCronJobToggleMutation()

  return (
    <>
      <div className="bg-surface-100 border-default overflow-hidden border shadow px-5 py-4 flex flex-row rounded-md space-x-4">
        <div>
          <Clock size={20} className="text-foreground-muted mt-0.5 translate-y-0.5" />
        </div>
        <div className="flex flex-col flex-0 overflow-y-auto w-full">
          <div className="flex flex-row justify-between items-center">
            <span
              className={cn(
                'text-base',
                job.jobname === null ? 'text-foreground-lighter' : 'text-foreground'
              )}
            >
              {job.jobname ?? 'No name provided'}
            </span>
            <div className="flex items-center gap-x-2">
              {isLoading ? (
                <Loader2 size={18} strokeWidth={2} className="animate-spin text-foreground-muted" />
              ) : (
                <Label_Shadcn_
                  htmlFor={`cron-job-active-${job.jobid}`}
                  className="text-foreground-light text-xs"
                >
                  {job.active ? 'Active' : 'Inactive'}
                </Label_Shadcn_>
              )}
              <Switch
                id={`cron-job-active-${job.jobid}`}
                size="large"
                disabled={isLoading}
                checked={job.active}
                onCheckedChange={() => showToggleConfirmationModal(true)}
              />
              <Button
                asChild
                type="default"
                icon={<History />}
                onClick={() => {
                  sendEvent({
                    action: TelemetryActions.CRON_JOB_HISTORY_CLICKED,
                    groups: {
                      project: selectedProject?.ref ?? 'Unknown',
                      organization: org?.slug ?? 'Unknown',
                    },
                  })
                }}
              >
                <Link
                  href={`/project/${ref}/integrations/cron/jobs/${encodeURIComponent(job.jobname)}`}
                >
                  History
                </Link>
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
                        groups: {
                          project: selectedProject?.ref ?? 'Unknown',
                          organization: org?.slug ?? 'Unknown',
                        },
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
                        groups: {
                          project: selectedProject?.ref ?? 'Unknown',
                          organization: org?.slug ?? 'Unknown',
                        },
                      })
                      onDeleteCronJob(job)
                    }}
                  >
                    Delete cron job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="text-sm flex flex-row space-x-5 py-4">
            <div className="flex flex-col w-full space-y-2">
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">Schedule</span>
                <div className="col-span-9">
                  <Input readOnly title={schedule} value={schedule} className="w-96" />
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">Last run</span>
                <div className="col-span-9">
                  <div
                    className={cn(
                      'border border-control bg-foreground/[0.026] rounded-md px-3 py-1.5 w-96',
                      !lastRun && 'text-foreground-lighter'
                    )}
                  >
                    {lastRun ? (
                      <>
                        <TimestampInfo
                          utcTimestamp={lastRun}
                          labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                          className="font-sans text-sm"
                        />
                        {data?.status && (
                          <Badge
                            variant={data.status === 'failed' ? 'destructive' : 'success'}
                            className="capitalize ml-2"
                          >
                            {data.status}
                          </Badge>
                        )}
                      </>
                    ) : (
                      'Job has not been run yet'
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3 items-center">
                <span className="text-foreground-light col-span-1">Next run</span>
                <div className="col-span-9">
                  <div
                    className={cn(
                      'border border-control bg-foreground/[0.026] rounded-md px-3 py-1.5 w-96',
                      !nextRun && 'text-foreground-lighter'
                    )}
                  >
                    {nextRun ? (
                      <TimestampInfo
                        utcTimestamp={nextRun}
                        labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                        className="font-sans text-sm"
                      />
                    ) : (
                      'Unable to parse next run for job'
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-3">
                <span className="text-foreground-light col-span-1">Command</span>
                <div className="col-span-9">
                  <CodeBlock
                    hideLineNumbers
                    value={job.command.trim()}
                    language="sql"
                    className={cn(
                      'py-2 px-3.5 max-w-full prose dark:prose-dark',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        visible={toggleConfirmationModalShown}
        title={job.active ? 'Disable cron job' : 'Enable cron job'}
        loading={isLoading}
        confirmLabel={job.active ? 'Disable' : 'Enable'}
        onCancel={() => showToggleConfirmationModal(false)}
        variant={job.active ? 'destructive' : undefined}
        onConfirm={() => {
          toggleDatabaseCronJob({
            projectRef: selectedProject?.ref!,
            connectionString: selectedProject?.connectionString,
            jobId: job.jobid,
            active: !job.active,
          })
          showToggleConfirmationModal(false)
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
