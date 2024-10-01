import { toString as CronToString } from 'cronstrue'
import { Clock, Loader2 } from 'lucide-react'
import { Button, Input, Label_Shadcn_, Switch } from 'ui'

import { SQLCodeBlock } from 'components/interfaces/Auth/ThirdPartyAuthForm/SqlCodeBlock'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseCronJobToggleMutation } from 'data/database-cron-jobs/database-cron-jobs-toggle-mutation'

interface CronJobCardProps {
  job: CronJob
  editCronJob: (job: CronJob) => void
  deleteCronJob: (job: CronJob) => void
}

export const CronJobCard = ({ job, editCronJob, deleteCronJob }: CronJobCardProps) => {
  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws
  let schedule = job.schedule
  try {
    const scheduleString = CronToString(job.schedule)
    schedule = scheduleString
  } catch {}

  const { project: selectedProject } = useProjectContext()
  const { mutate: toggleDatabaseCronJob, isLoading } = useDatabaseCronJobToggleMutation()

  return (
    <div className="bg-surface-100 border-default overflow-hidden border shadow px-5 py-4 flex flex-row first:rounded-t-md last:rounded-b-md space-x-4">
      <div>
        <Clock size={24} className="text-foreground-muted mt-0.5" />
      </div>
      <div className="flex flex-col flex-0 overflow-y-auto w-full">
        <div className="flex flex-row justify-between items-center px-1">
          <span className="text-base text-foreground">{job.jobname}</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin text-foreground-muted" />
            ) : (
              <Label_Shadcn_
                htmlFor={`cron-job-active-${job.jobid}`}
                className="text-foreground-light"
              >
                {job.active ? 'Active' : 'Inactive'}
              </Label_Shadcn_>
            )}
            <Switch
              id={`cron-job-active-${job.jobid}`}
              size="large"
              disabled={isLoading}
              checked={job.active}
              onCheckedChange={() => {
                toggleDatabaseCronJob({
                  projectRef: selectedProject?.ref!,
                  connectionString: selectedProject?.connectionString,
                  jobId: job.jobid,
                  active: !job.active,
                })
              }}
            />
          </div>
        </div>
        <div className="text-sm flex flex-row space-x-5 py-4">
          <div className="flex flex-col w-full space-y-2">
            <div className="grid grid-cols-10 gap-3 px-1 items-center">
              <span className="text-foreground-light col-span-1">Schedule</span>
              <div className="col-span-9">
                <Input
                  title={schedule}
                  readOnly
                  disabled
                  className="input-mono [&>div>div>div>input]:text-xs [&>div>div>div>input]:opacity-100 flex-1"
                  value={schedule}
                />
              </div>
            </div>
            <div className="grid grid-cols-10 gap-3 px-1">
              <span className="text-foreground-light col-span-1">Command</span>
              <div className="col-span-9">
                <SQLCodeBlock>{[job.command]}</SQLCodeBlock>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <Button type="default" disabled={false} onClick={() => editCronJob(job)}>
            Configure cron job
          </Button>
          <Button type="danger" disabled={false} onClick={() => deleteCronJob(job)}>
            Delete cron job
          </Button>
        </div>
      </div>
    </div>
  )
}
