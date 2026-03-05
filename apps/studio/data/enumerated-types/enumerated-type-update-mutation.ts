import { ident, literal } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { enumeratedTypesKeys } from './keys'

export type EnumeratedTypeUpdateVariables = {
  projectRef: string
  connectionString?: string | null
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
    statements.push(
      `alter type ${ident(schema)}.${ident(name.original)} rename to ${ident(name.updated)};`
    )
  }
  if (values.length > 0) {
    values.forEach((x, idx) => {
      if (x.isNew) {
        if (idx === 0) {
          // Consider if any new enums were added before any existing enums
          const firstExistingEnumValue = values.find((x) => !x.isNew)
          statements.push(
            `alter type ${ident(schema)}.${ident(name.updated)} add value ${literal(
              x.updated
            )} before ${literal(firstExistingEnumValue?.original)};`
          )
        } else {
          statements.push(
            `alter type ${ident(schema)}.${ident(name.updated)} add value ${literal(x.updated)} after ${literal(
              values[idx - 1].updated
            )};`
          )
        }
      } else if (x.original !== x.updated) {
        statements.push(
          `alter type ${ident(schema)}.${ident(name.updated)} rename value ${literal(x.original)} to ${literal(
            x.updated
          )};`
        )
      }
    })
  }
  if (description !== undefined) {
    statements.push(
      `comment on type ${ident(schema)}.${ident(name.updated)} is ${literal(description)};`
    )
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
  UseCustomMutationOptions<EnumeratedTypeUpdateData, ResponseError, EnumeratedTypeUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeUpdateData, ResponseError, EnumeratedTypeUpdateVariables>({
    mutationFn: (vars) => updateEnumeratedType(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: enumeratedTypesKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update enumerated type: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
