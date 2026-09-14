import { CRON_CLEANUP_JOB_NAME, getScheduleDeleteCronJobRunDetailsSql } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseCronJobsKeys, getScheduleDeleteCronJobRunDetailsKey } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ScheduleCronJobRunDetailsCleanupVariables = {
  projectRef: string
  connectionString?: string | null
  interval: string
}

export async function scheduleCronJobRunDetailsCleanup({
  projectRef,
  connectionString,
  interval,
}: ScheduleCronJobRunDetailsCleanupVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: getScheduleDeleteCronJobRunDetailsSql(interval),
    queryKey: getScheduleDeleteCronJobRunDetailsKey(projectRef, interval),
  })

  return result
}

type ScheduleCronJobRunDetailsCleanupData = Awaited<
  ReturnType<typeof scheduleCronJobRunDetailsCleanup>
>

export const useScheduleCronJobRunDetailsCleanupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ScheduleCronJobRunDetailsCleanupData,
    ResponseError,
    ScheduleCronJobRunDetailsCleanupVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ScheduleCronJobRunDetailsCleanupData,
    ResponseError,
    ScheduleCronJobRunDetailsCleanupVariables
  >({
    mutationFn: (vars) => scheduleCronJobRunDetailsCleanup(vars),
    async onSuccess(data, variables, context) {
      // Deliberately narrower than the jobs() prefix: invalidating the jobs list here would
      // refetch it while it sits in the cost-threshold error state, which briefly resets it
      // to pending and unmounts the overflow notice (closing its dialog mid-flow). Both
      // callers refetch their own grid via callbacks instead.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: databaseCronJobsKeys.job(variables.projectRef, CRON_CLEANUP_JOB_NAME),
        }),
        queryClient.invalidateQueries({
          queryKey: databaseCronJobsKeys.count(variables.projectRef),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to schedule clean up job: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
