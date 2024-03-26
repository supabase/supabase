import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'

export type EnumeratedTypeUpdateVariables = {
  projectRef: string
  connectionString: string
  schema: string
  name: { original: string; updated: string }
  description?: string
  values?: { original: string; updated: string; isNew: boolean }[]
}

export async function updateEnumeratedType({
  projectRef,
  connectionString,
  schema,
  name,
  description,
  values = [],
}: EnumeratedTypeUpdateVariables) {
  const statements: string[] = []
  if (name.original !== name.updated) {
    statements.push(`alter type "${schema}"."${name.original}" rename to "${name.updated}";`)
  }
  if (values.length > 0) {
    values.forEach((x, idx) => {
      if (x.isNew) {
        if (idx === 0) {
          // Consider if any new enums were added before any existing enums
          const firstExistingEnumValue = values.find((x) => !x.isNew)
          statements.push(
            `alter type "${schema}"."${name.updated}" add value '${x.updated}' before '${firstExistingEnumValue?.original}';`
          )
        } else {
          statements.push(
            `alter type "${schema}"."${name.updated}" add value '${x.updated}' after '${
              values[idx - 1].updated
            }';`
          )
        }
      } else if (x.original !== x.updated) {
        statements.push(
          `alter type "${schema}"."${name.updated}" rename value '${x.original}' to '${x.updated}';`
        )
      }
    })
  }
  if (description !== undefined) {
    statements.push(`comment on type "${schema}"."${name.updated}" is '${description}';`)
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
