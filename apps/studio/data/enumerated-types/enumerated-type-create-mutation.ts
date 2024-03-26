import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'

export type EnumeratedTypeCreateVariables = {
  projectRef: string
  connectionString: string
  schema: string
  name: string
  description?: string
  values: string[]
}

export async function createEnumeratedType({
  projectRef,
  connectionString,
  schema,
  name,
  description,
  values,
}: EnumeratedTypeCreateVariables) {
  const createSql = `create type "${schema}"."${name}" as enum (${values
    .map((x) => `'${x}'`)
    .join(', ')});`
  const commentSql =
    description !== undefined ? `comment on type "${schema}"."${name}" is '${description}';` : ''
  const sql = wrapWithTransaction(`${createSql} ${commentSql}`)
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type EnumeratedTypeCreateData = Awaited<ReturnType<typeof createEnumeratedType>>

export const useEnumeratedTypeCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>(
    (vars) => createEnumeratedType(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(enumeratedTypesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create enumerated type: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
