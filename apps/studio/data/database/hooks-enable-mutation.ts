import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type HooksEnableVariables = {
  ref: string
}

export async function enableDatabaseWebhooks({ ref }: HooksEnableVariables) {
  const { data, error } = await post('/platform/database/{ref}/hook-enable', {
    params: { path: { ref } },
  })
  if (error) throw error
  return data
}

type HooksEnableData = Awaited<ReturnType<typeof enableDatabaseWebhooks>>

export const useHooksEnableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<HooksEnableData, ResponseError, HooksEnableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<HooksEnableData, ResponseError, HooksEnableVariables>(
    (vars) => enableDatabaseWebhooks(vars),
    {
      async onSuccess(data, variables, context) {
        const { ref } = variables
        await onSuccess?.(data, variables, context)
        await queryClient.invalidateQueries(databaseKeys.schemaList(ref))
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to enable webhooks: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
