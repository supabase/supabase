import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { configKeys } from 'data/config/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseExtensionsKeys } from './keys'

export type DatabaseExtensionDisableVariables = {
  projectRef: string
  connectionString?: string | null
  id: string
  cascade?: boolean
}

export async function disableDatabaseExtension({
  projectRef,
  connectionString,
  id,
  cascade,
}: DatabaseExtensionDisableVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { sql } = pgMeta.extensions.remove(id, { cascade })
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['extension', 'delete', id],
  })

  return result
}

type DatabaseExtensionDisableData = Awaited<ReturnType<typeof disableDatabaseExtension>>

export const useDatabaseExtensionDisableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >({
    mutationFn: (vars) => disableDatabaseExtension(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: databaseExtensionsKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: configKeys.upgradeEligibility(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable database extension: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
