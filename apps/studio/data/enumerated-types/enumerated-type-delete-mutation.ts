import { ident } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { enumeratedTypesKeys } from './keys'

export type EnumeratedTypeDeleteVariables = {
  projectRef: string
  connectionString: string | null
  name: string
  schema: string
}

export async function deleteEnumeratedType({
  projectRef,
  connectionString,
  name,
  schema,
}: EnumeratedTypeDeleteVariables) {
  const sql = `drop type if exists ${ident(schema)}.${ident(name)}`
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type EnumeratedTypeDeleteData = Awaited<ReturnType<typeof deleteEnumeratedType>>

export const useEnumeratedTypeDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>({
    mutationFn: (vars) => deleteEnumeratedType(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: enumeratedTypesKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete enumerated type: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
