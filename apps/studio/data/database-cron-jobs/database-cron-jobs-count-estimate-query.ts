import { useQuery } from '@tanstack/react-query'

import type { ConnectionVars } from 'data/common.types'
import { executeSql } from 'data/sql/execute-sql-query'
import {
  getLiveTupleEstimate,
  getLiveTupleEstimateKey,
} from 'data/sql/queries/get-live-tuple-stats'
import type { UseCustomQueryOptions } from 'types'

type DatabaseCronJobsCountEstimateVariables = ConnectionVars

const cronJobsCountEstimateSql = getLiveTupleEstimate('job', 'cron')
const cronJobsCountEstimateKey = (projectRef: string | undefined) =>
  getLiveTupleEstimateKey(projectRef, 'job', 'cron')

export async function getCronJobsCountEstimate({
  projectRef,
  connectionString,
}: DatabaseCronJobsCountEstimateVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql<Array<{ live_tuple_estimate: number }>>({
    projectRef,
    connectionString,
    sql: cronJobsCountEstimateSql,
    queryKey: cronJobsCountEstimateKey(projectRef),
  })

  return result?.[0]?.live_tuple_estimate
}

export type DatabaseCronJobsCountEstimateData = Awaited<ReturnType<typeof getCronJobsCountEstimate>>
export type DatabaseCronJobsCountEstimateError = Error

export const useCronJobsCountEstimateQuery = <TData = DatabaseCronJobsCountEstimateData>(
  { projectRef, connectionString }: DatabaseCronJobsCountEstimateVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    DatabaseCronJobsCountEstimateData,
    DatabaseCronJobsCountEstimateError,
    TData
  > = {}
) =>
  useQuery<DatabaseCronJobsCountEstimateData, DatabaseCronJobsCountEstimateError, TData>({
    queryKey: cronJobsCountEstimateKey(projectRef),
    queryFn: () => getCronJobsCountEstimate({ projectRef, connectionString }),
    enabled: enabled && projectRef !== undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
