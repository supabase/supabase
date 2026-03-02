import { keepPreviousData } from '@tanstack/react-query'
import { useCronJobsCountEstimateQuery } from 'data/database-cron-jobs/database-cron-jobs-count-estimate-query'
import { useCronJobsCountQuery } from 'data/database-cron-jobs/database-cron-jobs-count-query'
import {
  CronJob,
  useCronJobsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useMemo } from 'react'
import type { ResponseError } from 'types'

import { CRON_JOBS_THRESHOLD } from './CronJobsTab.constants'
import type { ConnectionVars } from '@/data/common.types'
import { useCronJobsMinimalInfiniteQuery } from '@/data/database-cron-jobs/database-cron-jobs-minimal-infinite-query'
import { COST_THRESHOLD_ERROR } from '@/data/sql/execute-sql-query'

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
  queryCost?: number
  isSuccess: boolean
  isLoading: boolean
  error: ResponseError | null
  isRefetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  isMinimal: boolean
  refetch: () => void
  fetchNextPage: () => void
}

interface CronJobsCountState {
  value: number | undefined
  isEstimate: boolean
  isLoading: boolean
}

// =============================================================================
// Result type
// =============================================================================

interface UseCronJobsDataResult {
  /** State for the cron jobs grid */
  grid: CronJobsGridState
  /** State for the cron jobs count (exact or estimate) */
  count: CronJobsCountState
}
export function useCronJobsData({
  projectRef,
  connectionString,
  searchQuery,
}: UseCronJobsDataParams): UseCronJobsDataResult {
  const isProjectReady = !!projectRef

  const {
    data: cronJobsData,
    error: cronJobsError,
    isSuccess: isCronJobsSuccess,
    isLoading: isCronJobsLoading,
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
    }
  )
  const useMinimalQuery = cronJobsError?.message === COST_THRESHOLD_ERROR

  const {
    data: cronJobsMinimalData,
    error: cronJobsMinimalError,
    isSuccess: isCronJobsMinimalSuccess,
    isLoading: isCronJobsMinimalLoading,
    isRefetching: isCronJobsMinimalRefetching,
    isFetchingNextPage: isFetchingNextPageMinimal,
    hasNextPage: hasNextPageMinimal = false,
    refetch: refetchCronJobsMinimal,
    fetchNextPage: fetchNextPageMinimal,
  } = useCronJobsMinimalInfiniteQuery(
    { projectRef, connectionString, searchTerm: searchQuery ?? undefined },
    {
      placeholderData: Boolean(searchQuery) ? keepPreviousData : undefined,
      staleTime: Infinity,
      enabled: useMinimalQuery,
    }
  )

  const cronJobs = useMemo(() => {
    if (useMinimalQuery) {
      return cronJobsMinimalData?.pages.flatMap((page) => page) ?? []
    } else {
      return cronJobsData?.pages.flatMap((page) => page) ?? []
    }
  }, [useMinimalQuery, cronJobsData?.pages, cronJobsMinimalData?.pages])

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

  return {
    grid: {
      rows: cronJobs,
      queryCost: cronJobsError?.metadata?.cost,
      error: useMinimalQuery ? cronJobsMinimalError : cronJobsError,
      isSuccess: useMinimalQuery ? isCronJobsMinimalSuccess : isCronJobsSuccess,
      isLoading: useMinimalQuery ? isCronJobsMinimalLoading : isCronJobsLoading,
      isRefetching: useMinimalQuery ? isCronJobsMinimalRefetching : isCronJobsRefetching,
      isFetchingNextPage: useMinimalQuery ? isFetchingNextPageMinimal : isFetchingNextPage,
      hasNextPage: useMinimalQuery ? hasNextPageMinimal : hasNextPage,
      isMinimal: useMinimalQuery,
      refetch: useMinimalQuery ? refetchCronJobsMinimal : refetchCronJobs,
      fetchNextPage: useMinimalQuery ? fetchNextPageMinimal : fetchNextPage,
    },
    count: {
      value: isCountQueryEnabled ? exactCount : estimatedCount,
      isEstimate: !isCountQueryEnabled,
      isLoading: isCountQueryEnabled ? isLoadingExactCount : isLoadingEstimatedCount,
    },
  }
}
