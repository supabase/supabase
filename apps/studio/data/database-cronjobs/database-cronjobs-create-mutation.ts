import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronjobsKeys } from './keys'

export type DatabaseCronjobCreateVariables = {
  projectRef: string
  connectionString?: string
  query: string
}

export async function createDatabaseCronjob({
  projectRef,
  connectionString,
  query,
}: DatabaseCronjobCreateVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
    queryKey: ['cronjobs', 'create'],
  })

  return result
}

type DatabaseCronjobCreateData = Awaited<ReturnType<typeof createDatabaseCronjob>>

export const useDatabaseCronjobCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronjobCreateData, ResponseError, DatabaseCronjobCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronjobCreateData, ResponseError, DatabaseCronjobCreateVariables>(
    (vars) => createDatabaseCronjob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronjobsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database cronjob: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
