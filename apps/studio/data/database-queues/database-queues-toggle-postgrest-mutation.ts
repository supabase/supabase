import { getExposeQueuesSQL, HIDE_QUEUES_FROM_POSTGREST_SQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseQueuesKeys } from './keys'
import { databaseKeys } from '@/data/database/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { isGreaterThanOrEqual } from '@/lib/semver'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DatabaseQueueExposePostgrestVariables = {
  projectRef: string
  enable: boolean
  pgmqVersion: string

  connectionString?: string | null
}

const CONDITIONAL_READ_SIGNATURE_PGMQ_VERSION = '1.5.0'

export async function toggleQueuesExposurePostgrest({
  projectRef,
  pgmqVersion,
  connectionString,
  enable,
}: DatabaseQueueExposePostgrestVariables) {
  const isNewerPgmqversion = isGreaterThanOrEqual(
    pgmqVersion,
    CONDITIONAL_READ_SIGNATURE_PGMQ_VERSION
  )
  const sql = enable ? getExposeQueuesSQL({ isNewerPgmqversion }) : HIDE_QUEUES_FROM_POSTGREST_SQL

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['toggle-queues-exposure'],
  })

  return result
}

type DatabaseQueueExposePostgrestData = Awaited<ReturnType<typeof toggleQueuesExposurePostgrest>>

export const useDatabaseQueueToggleExposeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseQueueExposePostgrestData,
    ResponseError,
    DatabaseQueueExposePostgrestVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueExposePostgrestData,
    ResponseError,
    DatabaseQueueExposePostgrestVariables
  >({
    mutationFn: (vars) => toggleQueuesExposurePostgrest(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: databaseQueuesKeys.exposePostgrestStatus(projectRef),
      })
      // [Joshen] Schemas can be invalidated without waiting
      queryClient.invalidateQueries({ queryKey: databaseKeys.schemas(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to toggle queue exposure via PostgREST: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
