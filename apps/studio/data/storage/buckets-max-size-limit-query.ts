import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConnectionVars } from 'data/common.types'
import { getLiveTupleEstimate, getLiveTupleEstimateKey } from 'data/database/database.sql'
import { executeSql } from 'data/sql/execute-sql-query'
import { useCallback } from 'react'

import {
  getLargestSizeLimitBucketsKey,
  getLargestSizeLimitBucketsSqlUnoptimized,
} from './storage.sql'

export const THRESHOLD_FOR_AUTO_QUERYING_BUCKET_LIMITS = 10_000

export const getBucketNumberEstimateKey = (projectRef: string | undefined) =>
  getLiveTupleEstimateKey(projectRef, 'buckets', 'storage')

export const getBucketNumberEstimate = async ({
  projectRef,
  connectionString,
}: ConnectionVars): Promise<number | undefined> => {
  if (!projectRef) throw new Error('Project reference is required')

  const queryKey = getBucketNumberEstimateKey(projectRef)

  try {
    const sql = getLiveTupleEstimate('buckets', 'storage')
    const { result } = await executeSql<{ live_tuple_estimate: number }[]>({
      projectRef,
      connectionString,
      queryKey,
      sql,
    })
    return result[0]?.live_tuple_estimate
  } catch {
    return undefined
  }
}

export type BucketWithSizeLimit = {
  id: string
  name: string
  file_size_limit: number
}

const getBucketsWithLargestSizeLimit = async ({
  projectRef,
  connectionString,
}: ConnectionVars): Promise<BucketWithSizeLimit[]> => {
  if (!projectRef) throw new Error('Project reference is required')
  if (!connectionString) throw new Error('Connection string is required')

  const key = getLargestSizeLimitBucketsKey(projectRef)

  const sql = getLargestSizeLimitBucketsSqlUnoptimized
  const { result } = await executeSql<{ id: string; name: string; file_size_limit: number }[]>({
    projectRef,
    connectionString,
    queryKey: key,
    sql,
  })
  return result
}

type UseLargestBucketSizeLimitsCheckParams = ConnectionVars
type UseLargestBucketSizeLimitsCheckReturn = {
  /**
   * When the query for largest bucket size limits should be run.
   *
   * - `auto`: Run the query automatically.
   * - `confirm`: Ask the user for confirmation before running the query.
   */
  runCondition: 'auto' | 'confirm'
  /**
   * Run query to get the buckets with the largest file size limits. Buckets
   * are sorted in order of decreasing file size limit.
   *
   * @throws Error
   */
  runQuery: () => Promise<BucketWithSizeLimit[]>
  /**
   * Whether the bucket count estimate query is still running. Used by UI to
   * avoid flashing validation controls before we know if auto-validation is
   * safe.
   */
  isEstimatePending: boolean
}

export const useLargestBucketSizeLimitsCheck = ({
  projectRef,
  connectionString,
}: UseLargestBucketSizeLimitsCheckParams): UseLargestBucketSizeLimitsCheckReturn => {
  const queryClient = useQueryClient()

  const estimateKey = getBucketNumberEstimateKey(projectRef)

  const { data: estimatedRows, isPending: isEstimatePending } = useQuery<number | undefined>({
    // Query is the same even if connectionString changes, and doesn't correctly
    // track projectRef
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: estimateKey,
    queryFn: () => getBucketNumberEstimate({ projectRef, connectionString }),
    enabled: !!projectRef && !!connectionString,
  })

  const bucketLimitsKey = getLargestSizeLimitBucketsKey(projectRef)

  const fetchLargestBucketLimits = useCallback(
    () =>
      queryClient.fetchQuery({
        // Query is the same even if connectionString changes, and doesn't correctly
        // track projectRef
        // eslint-disable-next-line @tanstack/query/exhaustive-deps
        queryKey: bucketLimitsKey,
        queryFn: () => getBucketsWithLargestSizeLimit({ projectRef, connectionString }),
      }),
    [queryClient, projectRef, connectionString, bucketLimitsKey]
  )

  return {
    runCondition:
      estimatedRows !== undefined && estimatedRows <= THRESHOLD_FOR_AUTO_QUERYING_BUCKET_LIMITS
        ? 'auto'
        : 'confirm',
    runQuery: fetchLargestBucketLimits,
    isEstimatePending,
  }
}
