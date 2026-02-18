import { getScheduleDeleteCronJobRunDetailsSql } from 'data/database-cron-jobs/database-cron-jobs.sql'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  Button,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Progress,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { CLEANUP_INTERVALS } from './CronJobsTab.constants'
import {
  useCronJobsCleanupActions,
  type BatchDeletionProgress,
} from './CronJobsTab.useCleanupActions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface CronJobRunDetailsOverflowNoticeV2Props {
  refetchJobs: () => void
}

export const CronJobRunDetailsOverflowNoticeV2 = (
  props: CronJobRunDetailsOverflowNoticeV2Props
) => {
  return (
    <Admonition
      type="note"
      className="rounded-none border-x-0 border-t-0 py-2 [&>svg]:top-[0.6rem] [&>svg]:left-10 pl-10 pr-10"
      layout="horizontal"
      actions={<CronJobRunDetailsOverflowDialog {...props} />}
    >
      <p className="text-xs">Last run for each cron job omitted due to high query cost</p>
    </Admonition>
  )
}

const CronJobRunDetailsOverflowDialog = ({
  refetchJobs,
}: CronJobRunDetailsOverflowNoticeV2Props) => {
  const { data: project } = useSelectedProjectQuery()

  const {
    cleanupInterval,
    cleanupState,
    isScheduling,
    isScheduleSuccess,
    setCleanupInterval,
    runBatchedDeletion,
    scheduleCleanup,
    cancelDeletion,
  } = useCronJobsCleanupActions({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isDeleting = cleanupState.status === 'deleting'
  const isDeleteSuccess = cleanupState.status === 'delete-success'
  const isDeleteError = cleanupState.status === 'delete-error'
  const isBusy = isDeleting || isScheduling
  const canSchedule = isDeleteSuccess || isScheduleSuccess

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Learn more</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Last run for cron jobs omitted for overview</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2">
          <p className="text-sm">
            The dashboard fetches data for the cron jobs overview by running a join between the{' '}
            <code className="text-code-inline">cron.job</code> and{' '}
            <code className="text-code-inline !break-keep">cron.job_run_details</code> tables to
            show each cron job's latest run.
          </p>

          <p className="text-sm">
            However, the join was skipped as the estimated query cost exceeds safety thresholds,
            likely due to the size of{' '}
            <code className="text-code-inline !break-keep">cron.job_run_details</code> table.
          </p>
        </DialogSection>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-4">
          <p className="font-mono text-foreground-lighter uppercase tracking-tight text-sm">
            Suggested steps
          </p>

          <p className="text-sm">
            We recommend removing the old run history now, then scheduling a cron job that keeps
            trimming the <code className="text-code-inline">cron.job_run_details</code> table
            automatically. This also prevents unnecessary bloat on the database.
          </p>

          <div className="flex flex-col gap-y-2 text-sm">
            <p className="text-foreground">Step 1: Delete older entries</p>

            {isDeleting ? (
              <DeletionProgress progress={cleanupState.progress} onCancel={cancelDeletion} />
            ) : isDeleteSuccess ? (
              <DeletionSuccess totalRowsDeleted={cleanupState.totalRowsDeleted} />
            ) : isDeleteError ? (
              <DeletionError
                error={cleanupState.error}
                onRetry={() => runBatchedDeletion(cleanupInterval)}
              />
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="sm:w-64">
                  <Select_Shadcn_
                    disabled={isBusy}
                    value={cleanupInterval}
                    onValueChange={setCleanupInterval}
                  >
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_ placeholder="Select an interval" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {CLEANUP_INTERVALS.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>
                <Button
                  type="default"
                  disabled={isBusy}
                  onClick={() => runBatchedDeletion(cleanupInterval)}
                >
                  Delete rows now
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-y-2 text-sm">
            <p className="text-foreground">Step 2: Schedule an automated cleanup</p>

            {!canSchedule ? (
              <p className="text-foreground-lighter text-xs">
                Complete step 1 to enable scheduling a daily cleanup job.
              </p>
            ) : isScheduleSuccess ? (
              <ScheduleSuccess />
            ) : (
              <>
                <CodeBlock
                  hideLineNumbers
                  language="sql"
                  value={getScheduleDeleteCronJobRunDetailsSql(cleanupInterval)}
                  className="py-3 px-4 text-xs"
                  wrapperClassName="max-w-full"
                />
                <Button
                  block
                  size="small"
                  type="default"
                  className="mt-1"
                  loading={isScheduling}
                  disabled={isScheduling}
                  onClick={async () => {
                    await scheduleCleanup({
                      interval: cleanupInterval,
                      onSuccess: () => refetchJobs(),
                    })
                  }}
                >
                  Schedule cleanup job
                </Button>
              </>
            )}
          </div>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

interface DeletionProgressProps {
  progress: BatchDeletionProgress
  onCancel: () => void
}

const DeletionProgress = ({ progress, onCancel }: DeletionProgressProps) => {
  const { currentBatch, totalBatches, totalRowsDeleted } = progress
  const percentComplete =
    totalBatches > 0 ? Math.min(Math.round((currentBatch / totalBatches) * 100), 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Progress value={percentComplete} className="flex-1 h-2" />
        <span className="text-xs text-foreground-light whitespace-nowrap">
          {percentComplete}% ({currentBatch}/{totalBatches} batches)
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-light">
          Deleted {totalRowsDeleted.toLocaleString()} rows so far...
        </span>
        <Button type="outline" size="tiny" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

interface DeletionSuccessProps {
  totalRowsDeleted: number
}

const DeletionSuccess = ({ totalRowsDeleted }: DeletionSuccessProps) => (
  <div className="flex items-center gap-2 text-brand">
    <CheckCircle2 size={16} />
    <span className="text-sm">Successfully deleted {totalRowsDeleted.toLocaleString()} rows.</span>
  </div>
)

interface DeletionErrorProps {
  error: string
  onRetry: () => void
}

const DeletionError = ({ error, onRetry }: DeletionErrorProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-destructive">
      <XCircle size={16} />
      <span className="text-sm">Deletion failed: {error}</span>
    </div>
    <Button type="default" size="small" onClick={onRetry}>
      Retry
    </Button>
  </div>
)

const ScheduleSuccess = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-brand">
      <CheckCircle2 size={16} />
      <span className="text-sm">Daily cleanup job scheduled successfully.</span>
    </div>
    <div className="flex items-center gap-2">
      <p className="text-foreground-lighter text-xs">
        New cleanup job should now be visible in the cron jobs overview.
      </p>
    </div>
  </div>
)
