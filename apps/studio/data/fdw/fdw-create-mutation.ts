import { getCreateFDWSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fdwKeys } from './keys'
import { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { foreignTableKeys } from '@/data/foreign-tables/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { vaultSecretsKeys } from '@/data/vault/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type FDWCreateVariables = {
  projectRef?: string
  connectionString?: string | null
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  // If mode is skip, the wrapper will skip the last step, binding the schema/tables to foreign data. This could be done later.
  mode: 'tables' | 'schema' | 'skip'
  tables: any[]
  sourceSchema: string
  targetSchema: string
  schemaOptions?: SafeSqlFragment[]
}

export async function createFDW({ projectRef, connectionString, ...rest }: FDWCreateVariables) {
  const sql = wrapWithTransaction(getCreateFDWSql(rest))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

export type FDWCreateData = Awaited<ReturnType<typeof createFDW>>

export const useFDWCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<FDWCreateData, ResponseError, FDWCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWCreateData, ResponseError, FDWCreateVariables>({
    mutationFn: (vars) => createFDW(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fdwKeys.list(projectRef), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: foreignTableKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to create ${variables.wrapperMeta.label} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
