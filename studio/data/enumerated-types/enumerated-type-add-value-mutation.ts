import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'

export type EnumeratedTypeUpdateVariables = {
  projectRef: string
  connectionString: string
  name: string
  values: string[]
}

export async function addEnumeratedTypeValue({
  projectRef,
  connectionString,
  name,
  values,
}: EnumeratedTypeUpdateVariables) {
  const sql = `insert into ${name} values (${values.map((x) => `'${x}'`).join(', ')})`
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type EnumeratedTypeUpdateData = Awaited<ReturnType<typeof addEnumeratedTypeValue>>

export const useEnumeratedTypeUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EnumeratedTypeUpdateData, ResponseError, EnumeratedTypeUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeUpdateData, ResponseError, EnumeratedTypeUpdateVariables>(
    (vars) => addEnumeratedTypeValue(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(enumeratedTypesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to add value to enumerated type: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
