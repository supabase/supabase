import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronjobsKeys } from './keys'

export type DatabaseCronjobDeleteVariables = {
  projectRef: string
  connectionString?: string
  jobId: number
}

export async function deleteDatabaseCronjob({
  projectRef,
  connectionString,
  jobId,
}: DatabaseCronjobDeleteVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `SELECT cron.unschedule(${jobId});`,
    queryKey: ['cronjobs', 'delete'],
  })

  return result
}

type DatabaseCronjobDeleteData = Awaited<ReturnType<typeof deleteDatabaseCronjob>>

export const useDatabaseCronjobDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronjobDeleteData, ResponseError, DatabaseCronjobDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronjobDeleteData, ResponseError, DatabaseCronjobDeleteVariables>(
    (vars) => deleteDatabaseCronjob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronjobsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database cronjob: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
