import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'

export type EnumeratedTypeCreateVariables = {
  projectRef: string
  connectionString: string
  name: string
  values: string[]
}

export async function createEnumeratedType({
  projectRef,
  connectionString,
  name,
  values,
}: EnumeratedTypeCreateVariables) {
  const sql = `create type ${name} as enum (${values.map((x) => `'${x}'`).join(', ')})`
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
