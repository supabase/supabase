import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { pgSodiumKeys } from './keys'

export type CreateEncryptionKeyVariables = {
  projectRef: string
  connectionString?: string
  name: string
}

export async function createEncryptionKey({
  projectRef,
  connectionString,
  name,
}: CreateEncryptionKeyVariables) {
  const sql =
    name !== undefined
      ? `select * from pgsodium.create_key(name := '${name}')`
      : `select * from pgsodium.create_key()`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['projects', projectRef, 'pg-sodium-keys', 'create'],
  })

  return result
}

type EncryptionKeyCreateData = Awaited<ReturnType<typeof createEncryptionKey>>

export const usePgSodiumKeyCreateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<EncryptionKeyCreateData, ResponseError, CreateEncryptionKeyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EncryptionKeyCreateData, ResponseError, CreateEncryptionKeyVariables>(
    (vars) => createEncryptionKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(pgSodiumKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
