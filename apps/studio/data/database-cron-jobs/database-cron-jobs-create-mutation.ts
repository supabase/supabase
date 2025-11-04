import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobCreateVariables = {
  projectRef: string
  connectionString?: string | null
  query: string
  searchTerm?: string
  identifier?: string | number
}

export async function createDatabaseCronJob({
  projectRef,
  connectionString,
  query,
}: DatabaseCronJobCreateVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
    queryKey: databaseCronJobsKeys.create(),
  })

  return result
}

type DatabaseCronJobCreateData = Awaited<ReturnType<typeof createDatabaseCronJob>>

export const useDatabaseCronJobCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseCronJobCreateData,
    ResponseError,
    DatabaseCronJobCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronJobCreateData, ResponseError, DatabaseCronJobCreateVariables>({
    mutationFn: (vars) => createDatabaseCronJob(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, searchTerm, identifier } = variables

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: databaseCronJobsKeys.listInfinite(projectRef, searchTerm),
        }),
        ...(!!identifier
          ? [
              queryClient.invalidateQueries({
                queryKey: databaseCronJobsKeys.job(projectRef, identifier),
              }),
            ]
          : []),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create database cron job: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
