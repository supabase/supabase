import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'

import {
  Button,
  CodeBlock,
  Progress,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { getScheduleDeleteCronJobRunDetailsSql } from 'data/sql/queries/delete-cron-job-run-details'
import { CLEANUP_INTERVALS } from './CronJobsTab.constants'
import type { BatchDeletionProgress, CleanupState } from './CronJobsTab.useCleanupActions'

export interface CronJobRunDetailsOverflowNoticeProps {
  estimatedRows?: number
  mode: 'confirmed' | 'suspected'
  cleanupState: CleanupState
  selectedInterval: string
  onIntervalChange: (interval: string) => void
  onRunDeleteSql: () => void
  onRunScheduleSql: () => void
  onCancelDeletion: () => void
  onRetryDeletion: () => void
  onRefresh: () => void
}

export const CronJobRunDetailsOverflowNotice = ({
  estimatedRows,
  mode,
  cleanupState,
  selectedInterval,
  onIntervalChange,
  onRunDeleteSql,
  onRunScheduleSql,
  onCancelDeletion,
  onRetryDeletion,
  onRefresh,
}: CronJobRunDetailsOverflowNoticeProps) => {
  const formattedRowEstimate =
    typeof estimatedRows === 'number' ? estimatedRows.toLocaleString() : 'unknown'
  const noticeTitle =
    mode === 'confirmed'
      ? 'cron.job_run_details is too large to load'
      : 'Cron job overview timed out'
  const noticeDescription =
    mode === 'confirmed'
      ? `We detected approximately ${formattedRowEstimate} rows in cron.job_run_details, which prevents the overview from running.`
      : `Loading the cron job overview timed out. The issue might be caused by your cron.job_run_details table having too many rows.`

  const isDeleting = cleanupState.status === 'deleting'
  const isScheduling = cleanupState.status === 'scheduling'
  const isDeleteSuccess = cleanupState.status === 'delete-success'
  const isDeleteError = cleanupState.status === 'delete-error'
  const isScheduleSuccess = cleanupState.status === 'schedule-success'
  const isBusy = isDeleting || isScheduling

  const canSchedule = isDeleteSuccess || isScheduleSuccess

  return (
    <Admonition
      type="warning"
      title={noticeTitle}
      description={noticeDescription}
      className="max-w-3xl w-full"
    >
      <div className="space-y-4 text-sm">
        <p>
          Remove old run history now, then schedule a cron job that keeps trimming{' '}
          <code>cron.job_run_details</code> automatically so the overview remains responsive.
        </p>

        {/* Step 1: Delete older entries */}
        <div className="space-y-2">
          <p className="font-medium text-foreground">Step 1: Delete older entries</p>

          {isDeleting ? (
            <DeletionProgress progress={cleanupState.progress} onCancel={onCancelDeletion} />
          ) : isDeleteSuccess ? (
            <DeletionSuccess totalRowsDeleted={cleanupState.totalRowsDeleted} />
          ) : isDeleteError ? (
            <DeletionError error={cleanupState.error} onRetry={onRetryDeletion} />
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="sm:w-64">
                <Select_Shadcn_
                  value={selectedInterval}
                  onValueChange={onIntervalChange}
                  disabled={isBusy}
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
              <Button type="default" disabled={isBusy} onClick={onRunDeleteSql}>
                Delete rows now
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Schedule automated cleanup (only available after successful deletion) */}
        <div className="space-y-2">
          <p className="font-medium text-foreground">Step 2: Schedule an automated cleanup</p>

          {!canSchedule ? (
            <p className="text-foreground-lighter text-xs">
              Complete step 1 to enable scheduling a daily cleanup job.
            </p>
          ) : isScheduleSuccess ? (
            <ScheduleSuccess onRefresh={onRefresh} />
          ) : (
            <>
              <CodeBlock
                hideLineNumbers
                language="sql"
                value={getScheduleDeleteCronJobRunDetailsSql(selectedInterval)}
                className="py-3 px-4 text-xs"
                wrapperClassName="max-w-full"
              />
              <Button
                type="default"
                className="mt-1"
                loading={isScheduling}
                disabled={isScheduling}
                onClick={onRunScheduleSql}
              >
                Schedule cleanup job
              </Button>
            </>
          )}
        </div>
      </div>
    </Admonition>
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

interface ScheduleSuccessProps {
  onRefresh: () => void
}

const ScheduleSuccess = ({ onRefresh }: ScheduleSuccessProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-brand">
      <CheckCircle2 size={16} />
      <span className="text-sm">Daily cleanup job scheduled successfully.</span>
    </div>
    <div className="flex items-center gap-2">
      <p className="text-foreground-lighter text-xs">
        Refresh to reload the cron jobs and view the new cleanup job.
      </p>
      <Button type="default" size="tiny" icon={<RefreshCw size={14} />} onClick={onRefresh} />
    </div>
  </div>
)
