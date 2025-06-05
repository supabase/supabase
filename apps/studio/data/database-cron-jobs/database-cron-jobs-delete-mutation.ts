import { literal } from '@supabase/pg-meta/src/pg-format'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { applyAndTrackMigrations } from 'data/sql/utils/migrations'

export type DatabaseCronJobDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  jobId: number
}

export async function deleteDatabaseCronJob({
  projectRef,
  connectionString,
  jobId,
}: DatabaseCronJobDeleteVariables) {
  const sql = `SELECT cron.unschedule(${literal(jobId)})`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: applyAndTrackMigrations(sql, `delete_cron_${jobId}`),
    queryKey: databaseCronJobsKeys.delete(),
  })

  return result
}

type DatabaseCronJobDeleteData = Awaited<ReturnType<typeof deleteDatabaseCronJob>>

export const useDatabaseCronJobDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronJobDeleteData, ResponseError, DatabaseCronJobDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronJobDeleteData, ResponseError, DatabaseCronJobDeleteVariables>(
    (vars) => deleteDatabaseCronJob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronJobsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database cron job: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
