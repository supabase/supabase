import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import {
  CTID_BATCH_PAGE_SIZE,
  getDeleteOldCronJobRunDetailsByCtidKey,
  getDeleteOldCronJobRunDetailsByCtidSql,
  getJobRunDetailsPageCountKey,
  getJobRunDetailsPageCountSql,
} from 'data/sql/queries/delete-cron-job-run-details'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CLEANUP_INTERVALS } from './CronJobsTab.constants'
import type { ConnectionVars } from '@/data/common.types'
import { useScheduleCronJobRunDetailsCleanupMutation } from '@/data/database-cron-jobs/schedule-clean-up-mutation'

// Delay between batches to allow other queries to proceed (in milliseconds)
const BATCH_DELAY_MS = 100

type UseCronJobsCleanupActionsOptions = ConnectionVars

export interface BatchDeletionProgress {
  currentBatch: number
  totalBatches: number
  totalRowsDeleted: number
}

export type CleanupState =
  | { status: 'idle' }
  | { status: 'deleting'; progress: BatchDeletionProgress }
  | { status: 'delete-success'; totalRowsDeleted: number }
  | { status: 'delete-error'; error: string }

export const useCronJobsCleanupActions = ({
  projectRef,
  connectionString,
}: UseCronJobsCleanupActionsOptions) => {
  const [cleanupInterval, setCleanupInterval] = useState(CLEANUP_INTERVALS[0].value)
  const [cleanupState, setCleanupState] = useState<CleanupState>({ status: 'idle' })

  // Ref to track cancellation
  const cancelledRef = useRef(false)

  const { mutateAsync: executeSql } = useExecuteSqlMutation({
    onError: () => {}, // Error handled inline
  })

  const {
    mutate: scheduleCronJobCleanup,
    isPending: isScheduling,
    isSuccess: isScheduleSuccess,
  } = useScheduleCronJobRunDetailsCleanupMutation()

  /**
   * Run batched deletion using ctid ranges.
   * This approach scans the table in page chunks to avoid:
   * - Buffer cache pollution from full table scans
   * - Long-running transactions that block vacuum
   * - Lock accumulation from deleting millions of rows at once
   */
  const runBatchedDeletion = useCallback(
    async (interval: string) => {
      if (!projectRef) {
        console.error('[CronJobsTab > batch deletion] Project reference is required')
        toast.error('There was an error running the cleanup. Please try again.')
        return
      }

      cancelledRef.current = false

      try {
        // Step 1: Get the total number of pages in the table
        setCleanupState({
          status: 'deleting',
          progress: { currentBatch: 0, totalBatches: 0, totalRowsDeleted: 0 },
        })

        const pageCountResult = await executeSql({
          projectRef,
          connectionString,
          sql: getJobRunDetailsPageCountSql(),
          queryKey: getJobRunDetailsPageCountKey(projectRef),
        })

        const rawTotalPages = pageCountResult.result?.[0]?.num_pages ?? 0
        const totalPages = Number(rawTotalPages)
        if (!Number.isFinite(totalPages) || totalPages < 0) {
          throw new Error(
            `[CronJobs > cleanup actions] Invalid page count returned: ${rawTotalPages}`
          )
        }

        if (totalPages === 0) {
          setCleanupState({ status: 'delete-success', totalRowsDeleted: 0 })
          toast.success('The job_run_details table is empty.')
          return
        }

        const totalBatches = Math.ceil(totalPages / CTID_BATCH_PAGE_SIZE)
        let totalRowsDeleted = 0

        // Step 2: Iterate through pages in batches
        for (let batch = 0; batch < totalBatches; batch++) {
          // Check for cancellation
          if (cancelledRef.current) {
            setCleanupState({ status: 'idle' })
            toast.info('Deletion cancelled.')
            return
          }

          const startPage = batch * CTID_BATCH_PAGE_SIZE
          const endPage = Math.min((batch + 1) * CTID_BATCH_PAGE_SIZE, totalPages + 1)

          setCleanupState({
            status: 'deleting',
            progress: {
              currentBatch: batch + 1,
              totalBatches,
              totalRowsDeleted,
            },
          })

          const deleteResult = await executeSql({
            projectRef,
            connectionString,
            sql: getDeleteOldCronJobRunDetailsByCtidSql(interval, startPage, endPage),
            queryKey: getDeleteOldCronJobRunDetailsByCtidKey(projectRef, interval, startPage),
          })

          const deletedCount = deleteResult.result?.[0]?.deleted_count ?? 0
          totalRowsDeleted += deletedCount

          if (cancelledRef.current) {
            setCleanupState({ status: 'idle' })
            toast.info('Deletion cancelled.')
            return
          }

          if (batch < totalBatches - 1) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
          }
        }

        setCleanupState({ status: 'delete-success', totalRowsDeleted })
        toast.success(
          `Deleted ${totalRowsDeleted.toLocaleString()} cron job runs older than ${interval}.`
        )
      } catch (error) {
        console.error('[CronJobs] Batch deletion failed with error: %O', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setCleanupState({ status: 'delete-error', error: errorMessage })
        toast.error('Running the cleanup failed. Please try again.')
      }
    },
    [projectRef, connectionString, executeSql]
  )

  /**
   * Schedule a daily cleanup job.
   * This should only be called after a successful initial deletion.
   */
  const scheduleCleanup = useCallback(
    async ({ interval, onSuccess }: { interval: string; onSuccess?: () => void }) => {
      if (!projectRef) {
        console.error('[CronJobsTab > schedule cleanup] Project reference is required')
        toast.error('There was an error scheduling the cleanup. Please try again.')
        return
      }

      scheduleCronJobCleanup(
        { projectRef, connectionString, interval },
        {
          onSuccess: () => {
            toast.success('Scheduled daily cleanup job.')
            onSuccess?.()
          },
        }
      )
    },
    [connectionString, projectRef, scheduleCronJobCleanup]
  )

  /**
   * Cancel an in-progress deletion.
   */
  const cancelDeletion = useCallback(() => {
    cancelledRef.current = true
    setCleanupState({ status: 'idle' })
  }, [])

  return {
    cleanupInterval,
    cleanupState,
    isScheduling,
    isScheduleSuccess,
    setCleanupInterval,
    runBatchedDeletion,
    scheduleCleanup,
    cancelDeletion,
  }
}
