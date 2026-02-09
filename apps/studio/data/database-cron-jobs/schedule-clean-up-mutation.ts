import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'

import {
  getScheduleDeleteCronJobRunDetailsKey,
  getScheduleDeleteCronJobRunDetailsSql,
} from '../sql/queries/delete-cron-job-run-details'

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
  return useMutation<
    ScheduleCronJobRunDetailsCleanupData,
    ResponseError,
    ScheduleCronJobRunDetailsCleanupVariables
  >({
    mutationFn: (vars) => scheduleCronJobRunDetailsCleanup(vars),
    async onSuccess(data, variables, context) {
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
