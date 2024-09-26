import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronjobsKeys } from './keys'

export type DatabaseCronjobToggleVariables = {
  projectRef: string
  connectionString?: string
  jobId: number
  active: boolean
}

export async function toggleDatabaseCronjob({
  projectRef,
  connectionString,
  jobId,
  active,
}: DatabaseCronjobToggleVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select cron.alter_job(job_id := ${jobId}, active := ${active});`,
    queryKey: ['cronjobs', 'alter'],
  })

  return result
}

type DatabaseCronjobToggleData = Awaited<ReturnType<typeof toggleDatabaseCronjob>>

export const useDatabaseCronjobToggleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronjobToggleData, ResponseError, DatabaseCronjobToggleVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronjobToggleData, ResponseError, DatabaseCronjobToggleVariables>(
    (vars) => toggleDatabaseCronjob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronjobsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to toggle database cronjob: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
