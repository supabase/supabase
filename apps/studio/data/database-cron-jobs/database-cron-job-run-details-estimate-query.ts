import { QueryClient, useQuery } from '@tanstack/react-query'

import type { ConnectionVars } from 'data/common.types'
import { executeSql } from 'data/sql/execute-sql-query'
import {
  getLiveTupleEstimate,
  getLiveTupleEstimateKey,
} from 'data/sql/queries/get-live-tuple-stats'
import type { UseCustomQueryOptions } from 'types'

type DatabaseCronJobRunDetailsEstimateVariables = ConnectionVars

const cronJobRunDetailsEstimateSql = getLiveTupleEstimate('job_run_details', 'cron')
const cronJobRunDetailsEstimateKey = (projectRef: string | undefined) =>
  getLiveTupleEstimateKey(projectRef, 'job_run_details', 'cron')

export async function getCronJobRunDetailsEstimate({
  projectRef,
  connectionString,
}: DatabaseCronJobRunDetailsEstimateVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql<{ live_tuple_estimate: number }[]>({
    projectRef,
    connectionString,
    sql: cronJobRunDetailsEstimateSql,
    queryKey: cronJobRunDetailsEstimateKey(projectRef),
  })

  return result?.[0]?.live_tuple_estimate
}

export type DatabaseCronJobRunDetailsEstimateData = Awaited<
  ReturnType<typeof getCronJobRunDetailsEstimate>
>
export type DatabaseCronJobRunDetailsEstimateError = Error

export const useCronJobRunDetailsEstimateQuery = <TData = DatabaseCronJobRunDetailsEstimateData>(
  { projectRef, connectionString }: DatabaseCronJobRunDetailsEstimateVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    DatabaseCronJobRunDetailsEstimateData,
    DatabaseCronJobRunDetailsEstimateError,
    TData
  > = {}
) =>
  useQuery<DatabaseCronJobRunDetailsEstimateData, DatabaseCronJobRunDetailsEstimateError, TData>({
    queryKey: cronJobRunDetailsEstimateKey(projectRef),
    queryFn: () => getCronJobRunDetailsEstimate({ projectRef, connectionString }),
    enabled: enabled && projectRef !== undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  })

export function prefetchCronJobRunDetailsEstimate(
  client: QueryClient,
  { projectRef, connectionString }: DatabaseCronJobRunDetailsEstimateVariables
) {
  return client.fetchQuery({
    // Does not change if connection string changes
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: cronJobRunDetailsEstimateKey(projectRef),
    queryFn: () => getCronJobRunDetailsEstimate({ projectRef, connectionString }),
  })
}
