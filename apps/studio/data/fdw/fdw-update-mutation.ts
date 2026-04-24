import { getCreateFDWSql, getDeleteFDWSql, getUpdateFDWSql } from '@supabase/pg-meta'
import { wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { FDW } from './fdws-query'
import { fdwKeys } from './keys'
import type { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { foreignTableKeys } from '@/data/foreign-tables/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { vaultSecretsKeys } from '@/data/vault/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type FDWUpdateVariables = {
  projectRef?: string
  connectionString?: string | null
  wrapper: FDW
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  tables: any[]
  skipInvalidation?: boolean
}

export async function updateFDW({
  projectRef,
  connectionString,
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: FDWUpdateVariables) {
  const sql = wrapWithTransaction(getUpdateFDWSql({ wrapper, wrapperMeta, formState, tables }))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type FDWUpdateData = Awaited<ReturnType<typeof updateFDW>>

export const useFDWUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<FDWUpdateData, ResponseError, FDWUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWUpdateData, ResponseError, FDWUpdateVariables>({
    mutationFn: (vars) => updateFDW(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, skipInvalidation = false } = variables

      if (!skipInvalidation) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: fdwKeys.list(projectRef), refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
          queryClient.invalidateQueries({ queryKey: foreignTableKeys.list(projectRef) }),
          queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) }),
        ])
      }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to update ${variables.wrapper.name} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
