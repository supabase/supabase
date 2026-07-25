import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type PostgrestSchemaCacheVariables = {
  ref: string
  region: string
  action: 'reload' | 'clear' | 'diagnose'
}

export async function managePostgrestSchemaCache({
  ref,
  region,
  action,
}: PostgrestSchemaCacheVariables) {
  const { data, error } = await post('/platform/projects/{ref}/postgrest/schema-cache', {
    params: { path: { ref } },
    body: {
      schemaCacheRequest: {
        region,
        action,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type PostgrestSchemaCacheData = Awaited<ReturnType<typeof managePostgrestSchemaCache>>

export const usePostgrestSchemaCacheMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    PostgrestSchemaCacheData,
    ResponseError,
    PostgrestSchemaCacheVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<PostgrestSchemaCacheData, ResponseError, PostgrestSchemaCacheVariables>({
    mutationFn: (vars) => managePostgrestSchemaCache(vars),
    async onSuccess(data, variables, context) {
      const actionMessages = {
        reload: 'Schema cache reload initiated',
        clear: 'Schema cache cleared successfully',
        diagnose: 'Diagnostics completed',
      }
      toast.success(actionMessages[variables.action] || 'Operation completed')
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        const errorMessages = {
          reload: 'Failed to reload schema cache',
          clear: 'Failed to clear schema cache',
          diagnose: 'Failed to run diagnostics',
        }
        toast.error(`${errorMessages[variables.action] || 'Operation failed'}: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}