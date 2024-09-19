import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'

export type EnumeratedTypeDeleteVariables = {
  projectRef: string
  connectionString: string
  name: string
  schema: string
}

export async function deleteEnumeratedType({
  projectRef,
  connectionString,
  name,
  schema,
}: EnumeratedTypeDeleteVariables) {
  const sql = `drop type if exists ${schema}."${name}"`
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type EnumeratedTypeDeleteData = Awaited<ReturnType<typeof deleteEnumeratedType>>

export const useEnumeratedTypeDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>(
    (vars) => deleteEnumeratedType(vars),
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
