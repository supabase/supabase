import { toString as CronToString } from 'cronstrue'
import { Clock, Loader2 } from 'lucide-react'
import { Button, Input, Label_Shadcn_, Switch } from 'ui'

import { SQLCodeBlock } from 'components/interfaces/Auth/ThirdPartyAuthForm/SqlCodeBlock'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Cronjob } from 'data/database-cronjobs/database-cronjobs-query'
import { useDatabaseCronjobToggleMutation } from 'data/database-cronjobs/database-cronjobs-toggle-mutation'

interface CronjobCardProps {
  job: Cronjob
  editCronjob: (job: Cronjob) => void
  deleteCronjob: (job: Cronjob) => void
}

export const CronjobCard = ({ job, editCronjob, deleteCronjob }: CronjobCardProps) => {
  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws
  let schedule = job.schedule
  try {
    const scheduleString = CronToString(job.schedule)
    schedule = scheduleString
  } catch {}

  const { project: selectedProject } = useProjectContext()
  const { mutate: toggleDatabaseCronjob, isLoading } = useDatabaseCronjobToggleMutation()

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
                htmlFor={`cronjob-active-${job.jobid}`}
                className="text-foreground-light"
              >
                {job.active ? 'Active' : 'Inactive'}
              </Label_Shadcn_>
            )}
            <Switch
              id={`cronjob-active-${job.jobid}`}
              size="large"
              disabled={isLoading}
              checked={job.active}
              onCheckedChange={() => {
                toggleDatabaseCronjob({
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
          <Button type="default" disabled={false} onClick={() => editCronjob(job)}>
            Configure cronjob
          </Button>
          <Button type="danger" disabled={false} onClick={() => deleteCronjob(job)}>
            Delete cronjob
          </Button>
        </div>
      </div>
    </div>
  )
}
