import { ident, literal } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { enumeratedTypesKeys } from './keys'

export type EnumeratedTypeCreateVariables = {
  projectRef: string
  connectionString: string | null
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
  const createSql = `create type ${ident(schema)}.${ident(name)} as enum (${values
    .map((x) => `${literal(x)}`)
    .join(', ')});`
  const commentSql =
    description !== undefined
      ? `comment on type ${ident(schema)}.${ident(name)} is ${literal(description)};`
      : ''
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
  UseCustomMutationOptions<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>({
    mutationFn: (vars) => createEnumeratedType(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: enumeratedTypesKeys.list(projectRef) })
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
  })
}
