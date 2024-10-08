import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobToggleVariables = {
  projectRef: string
  connectionString?: string
  jobId: number
  active: boolean
}

export async function toggleDatabaseCronJob({
  projectRef,
  connectionString,
  jobId,
  active,
}: DatabaseCronJobToggleVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select cron.alter_job(job_id := ${jobId}, active := ${active});`,
    queryKey: databaseCronJobsKeys.alter(),
  })

  return result
}

type DatabaseCronJobToggleData = Awaited<ReturnType<typeof toggleDatabaseCronJob>>

export const useDatabaseCronJobToggleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronJobToggleData, ResponseError, DatabaseCronJobToggleVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronJobToggleData, ResponseError, DatabaseCronJobToggleVariables>(
    (vars) => toggleDatabaseCronJob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronJobsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to toggle database cron job: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
