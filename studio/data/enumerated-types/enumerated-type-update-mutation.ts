import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'

export type EnumeratedTypeUpdateVariables = {
  projectRef: string
  connectionString: string
  originalName: string
  name: string
  values?: string[]
}

export async function updateEnumeratedType({
  projectRef,
  connectionString,
  originalName,
  name,
  values = [],
}: EnumeratedTypeUpdateVariables) {
  const statements: string[] = []
  if (originalName !== name) {
    statements.push(`alter type ${originalName} rename to ${name};`)
  }
  if (values.length > 0) {
    values.forEach((x) => statements.push(`alter type ${name} add value '${x}';`))
  }

  const sql = wrapWithTransaction(statements.join(' '))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type EnumeratedTypeUpdateData = Awaited<ReturnType<typeof updateEnumeratedType>>

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
    (vars) => updateEnumeratedType(vars),
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
