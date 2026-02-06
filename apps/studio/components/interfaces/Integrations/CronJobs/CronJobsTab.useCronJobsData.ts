import { keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ConnectionVars } from '@/data/common.types'
import { useCronJobRunDetailsEstimateQuery } from 'data/database-cron-jobs/database-cron-job-run-details-estimate-query'
import { useCronJobsCountEstimateQuery } from 'data/database-cron-jobs/database-cron-jobs-count-estimate-query'
import { useCronJobsCountQuery } from 'data/database-cron-jobs/database-cron-jobs-count-query'
import {
  CronJob,
  useCronJobsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import type { ResponseError } from 'types'
import { CRON_JOBS_THRESHOLD, JOB_RUN_DETAILS_THRESHOLD } from './CronJobsTab.constants'

// =============================================================================
// Input types
// =============================================================================

type UseCronJobsDataParams = ConnectionVars & {
  searchQuery: string | null
}

// =============================================================================
// Shared state types (available in all states)
// =============================================================================

interface CronJobsGridState {
  rows: Array<CronJob>
  isLoading: boolean
  error: ResponseError | null
  isRefetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  refetch: () => void
  fetchNextPage: () => void
}

interface CronJobsCountState {
  value: number | undefined
  isEstimate: boolean
  isLoading: boolean
}

// =============================================================================
// Discriminated union for data fetching status
// =============================================================================

/** Still checking the size of the job_run_details table */
interface StatusLoading {
  status: 'loading'
}

/** Failed to check the table size - show error with retry option */
interface StatusEstimateError {
  status: 'estimate-error'
  error: Error
  isRetrying: boolean
  retry: () => void
}

/** Table is confirmed to be too large - show cleanup notice */
interface StatusOverflowConfirmed {
  status: 'overflow-confirmed'
  estimatedRows: number
}

/** Query timed out - suspected large table, show cleanup notice */
interface StatusOverflowSuspected {
  status: 'overflow-suspected'
  estimatedRows: number | undefined
}

/** Normal state - queries can run */
interface StatusReady {
  status: 'ready'
}

type CronJobsDataStatus =
  | StatusLoading
  | StatusEstimateError
  | StatusOverflowConfirmed
  | StatusOverflowSuspected
  | StatusReady

// =============================================================================
// Result type
// =============================================================================

interface UseCronJobsDataResult {
  /** Discriminated union indicating the current data fetching status */
  dataStatus: CronJobsDataStatus
  /** Whether queries are enabled (not gated due to large table or loading) */
  isQueryEnabled: boolean
  /** State for the cron jobs grid */
  grid: CronJobsGridState
  /** State for the cron jobs count (exact or estimate) */
  count: CronJobsCountState
}

// =============================================================================
// Hook implementation
// =============================================================================

/**
 * Custom hook that encapsulates all data fetching logic for the CronJobsTab.
 *
 * This hook manages the complex query dependencies:
 * 1. First, estimate the size of the job_run_details table
 * 2. If the table is small enough, fetch the actual cron jobs
 * 3. If the table is too large, show estimates instead and display a cleanup notice
 *
 * The `dataStatus` discriminated union ensures type-safe handling of all states:
 * - 'loading': Still checking table size
 * - 'estimate-error': Failed to check, show retry option
 * - 'overflow-confirmed': Table too large (from estimate)
 * - 'overflow-suspected': Query timed out
 * - 'ready': Normal operation
 */
export function useCronJobsData({
  projectRef,
  connectionString,
  searchQuery,
}: UseCronJobsDataParams): UseCronJobsDataResult {
  const isProjectReady = !!projectRef

  const {
    data: runDetailsEstimateValue,
    error: runDetailsEstimateError,
    isError: isRunDetailsEstimateError,
    isPending: isRunDetailsEstimatePending,
    isRefetching: isRefetchingRunDetailsEstimate,
    refetch: refetchRunDetailsEstimate,
  } = useCronJobRunDetailsEstimateQuery(
    { projectRef, connectionString },
    { enabled: isProjectReady }
  )

  const hasLargeRunDetailsTable =
    typeof runDetailsEstimateValue === 'number' &&
    runDetailsEstimateValue > JOB_RUN_DETAILS_THRESHOLD

  // Queries are enabled only when:
  // - Project is ready
  // - Estimate query has completed successfully
  // - Table is not too large
  const isQueryEnabled =
    isProjectReady &&
    !isRunDetailsEstimatePending &&
    !isRunDetailsEstimateError &&
    !hasLargeRunDetailsTable

  const {
    data: cronJobsData,
    error: cronJobsError,
    isLoading: isCronJobsLoading,
    isError: isCronJobsError,
    isRefetching: isCronJobsRefetching,
    isFetchingNextPage,
    hasNextPage = false,
    refetch: refetchCronJobs,
    fetchNextPage,
  } = useCronJobsInfiniteQuery(
    { projectRef, connectionString, searchTerm: searchQuery ?? undefined },
    {
      placeholderData: Boolean(searchQuery) ? keepPreviousData : undefined,
      staleTime: Infinity,
      enabled: isQueryEnabled,
    }
  )

  const cronJobs = useMemo(
    () => cronJobsData?.pages.flatMap((page) => page) ?? [],
    [cronJobsData?.pages]
  )

  // Fetch count - gated on cron.job table size
  // Always fetch the estimate first (it's fast since it uses pg_stat)
  const {
    data: estimatedCount,
    isPending: isLoadingEstimatedCount,
    isError: isEstimatedCountError,
  } = useCronJobsCountEstimateQuery({ projectRef, connectionString }, { enabled: isProjectReady })

  const hasLargeCronJobsTable =
    typeof estimatedCount === 'number' && estimatedCount > CRON_JOBS_THRESHOLD

  // Exact count is enabled when the cron.job table is small enough
  const isCountQueryEnabled =
    isProjectReady && !isLoadingEstimatedCount && !isEstimatedCountError && !hasLargeCronJobsTable

  const { data: exactCount, isPending: isLoadingExactCount } = useCronJobsCountQuery(
    { projectRef, connectionString },
    { enabled: isCountQueryEnabled }
  )

  // Determine if we should show a timeout error as a suspected overflow
  const isTimeoutError =
    isCronJobsError &&
    typeof cronJobsError?.message === 'string' &&
    cronJobsError.message.toLowerCase().includes('timeout')

  // Compute the discriminated status
  const dataStatus: CronJobsDataStatus = useMemo(() => {
    if (!isProjectReady || isRunDetailsEstimatePending) {
      return { status: 'loading' }
    }

    if (isRunDetailsEstimateError) {
      return {
        status: 'estimate-error',
        error: runDetailsEstimateError,
        isRetrying: isRefetchingRunDetailsEstimate,
        retry: refetchRunDetailsEstimate,
      }
    }

    if (hasLargeRunDetailsTable) {
      return {
        status: 'overflow-confirmed',
        estimatedRows: runDetailsEstimateValue!,
      }
    }

    if (isTimeoutError) {
      return {
        status: 'overflow-suspected',
        estimatedRows: runDetailsEstimateValue,
      }
    }

    return { status: 'ready' }
  }, [
    isProjectReady,
    isRunDetailsEstimatePending,
    isRunDetailsEstimateError,
    runDetailsEstimateError,
    isRefetchingRunDetailsEstimate,
    refetchRunDetailsEstimate,
    hasLargeRunDetailsTable,
    runDetailsEstimateValue,
    isTimeoutError,
  ])

  // Compute derived grid state
  const isGridLoading =
    dataStatus.status === 'loading' || (dataStatus.status === 'ready' && isCronJobsLoading)
  const gridError =
    dataStatus.status === 'ready' && isCronJobsError && !isTimeoutError
      ? cronJobsError ?? null
      : null

  return {
    dataStatus,
    isQueryEnabled,

    grid: {
      rows: cronJobs,
      isLoading: isGridLoading,
      error: gridError,
      isRefetching: isCronJobsRefetching,
      isFetchingNextPage,
      hasNextPage,
      refetch: refetchCronJobs,
      fetchNextPage,
    },

    count: {
      value: isCountQueryEnabled ? exactCount : estimatedCount,
      isEstimate: !isCountQueryEnabled,
      isLoading: isCountQueryEnabled ? isLoadingExactCount : isLoadingEstimatedCount,
    },
  }
}

// =============================================================================
// Type exports for consumers
// =============================================================================

export type { CronJobsCountState, CronJobsDataStatus, CronJobsGridState }
