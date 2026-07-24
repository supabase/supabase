import { CRON_CLEANUP_JOB_NAME, getScheduleDeleteCronJobRunDetailsSql } from '@supabase/pg-meta'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { CLEANUP_INTERVALS } from './CronJobsTab.constants'
import { useCronJobQuery } from '@/data/database-cron-jobs/database-cron-job-query'
import { useScheduleCronJobRunDetailsCleanupMutation } from '@/data/database-cron-jobs/schedule-clean-up-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

const DEFAULT_CLEANUP_INTERVAL =
  CLEANUP_INTERVALS.find((option) => option.value === '7 days')?.value ?? CLEANUP_INTERVALS[0].value

interface EnableCleanupButtonProps {
  onScheduled: () => void
}

/**
 * One-click action to schedule the daily cleanup job that trims old rows from
 * cron.job_run_details. Hidden once the cleanup job already exists — the job
 * itself then shows up in the jobs grid.
 */
export const EnableCleanupButton = ({ onScheduled }: EnableCleanupButtonProps) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)
  const [cleanupInterval, setCleanupInterval] = useState(DEFAULT_CLEANUP_INTERVAL)

  const { data: cleanupJob, isSuccess } = useCronJobQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    name: CRON_CLEANUP_JOB_NAME,
  })

  const { mutate: scheduleCleanup, isPending: isScheduling } =
    useScheduleCronJobRunDetailsCleanupMutation({
      onSuccess: () => {
        toast.success('Scheduled daily cleanup job.')
        setOpen(false)
        onScheduled()
      },
    })

  if (!isSuccess || cleanupJob !== null) return null

  const onConfirm = () => {
    if (!project?.ref) {
      return toast.error('There was an error scheduling the cleanup. Please try again.')
    }
    track('cron_job_cleanup_enable_button_clicked', {
      origin: 'dialog',
      retentionInterval: cleanupInterval,
    })
    scheduleCleanup({
      projectRef: project.ref,
      connectionString: project.connectionString,
      interval: cleanupInterval,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) track('cron_job_cleanup_enable_button_clicked', { origin: 'header' })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">Enable cleanup</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable automatic cleanup</DialogTitle>
          <DialogDescription>
            Schedules a daily job that deletes old cron job run records
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-4">
          <p className="text-sm">
            Every cron job run is recorded in the{' '}
            <code className="text-code-inline break-keep!">cron.job_run_details</code> table.
            Without periodic cleanup, the table grows indefinitely and bloats the database.
          </p>
          <div className="flex flex-col gap-y-2 text-sm">
            <p className="text-foreground">Delete run history</p>
            <div className="sm:w-64">
              <Select
                disabled={isScheduling}
                value={cleanupInterval}
                onValueChange={setCleanupInterval}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an interval" />
                </SelectTrigger>
                <SelectContent>
                  {CLEANUP_INTERVALS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CodeBlock
            hideLineNumbers
            language="sql"
            value={getScheduleDeleteCronJobRunDetailsSql(cleanupInterval)}
            className="py-3 px-4 text-xs"
            wrapperClassName="max-w-full"
          />
        </DialogSection>
        <DialogFooter>
          <Button variant="default" disabled={isScheduling} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={isScheduling} onClick={onConfirm}>
            Enable cleanup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
