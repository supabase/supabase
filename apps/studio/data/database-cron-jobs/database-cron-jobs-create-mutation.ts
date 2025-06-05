import { literal } from '@supabase/pg-meta/src/pg-format'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { applyAndTrackMigrations } from 'data/sql/utils/migrations'

export type DatabaseCronJobCreateVariables = {
  projectRef: string
  connectionString?: string | null
  name: string
  schedule: string
  command: string
}

export async function createDatabaseCronJob({
  projectRef,
  connectionString,
  name,
  schedule,
  command,
}: DatabaseCronJobCreateVariables) {
  const sql = `select cron.schedule(${literal(name)}, ${literal(schedule)}, $$${command}$$)`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: applyAndTrackMigrations(sql, `create_cron_${name}`),
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
  UseMutationOptions<DatabaseCronJobCreateData, ResponseError, DatabaseCronJobCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseCronJobCreateData, ResponseError, DatabaseCronJobCreateVariables>(
    (vars) => createDatabaseCronJob(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseCronJobsKeys.list(projectRef))
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
    }
  )
}
