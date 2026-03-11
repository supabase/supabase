import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { scopedAccessTokenKeys } from './keys'

export type ScopedAccessTokenDeleteVariables = {
  id: string
}

export async function deleteScopedAccessToken({ id }: ScopedAccessTokenDeleteVariables) {
  const { data, error } = await del('/platform/profile/scoped-access-tokens/{id}', {
    params: { path: { id } },
  })

  if (error) handleError(error)
  return data
}

type ScopedAccessTokenDeleteData = Awaited<ReturnType<typeof deleteScopedAccessToken>>

export const useScopedAccessTokenDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ScopedAccessTokenDeleteData, ResponseError, ScopedAccessTokenDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ScopedAccessTokenDeleteData, ResponseError, ScopedAccessTokenDeleteVariables>({
    mutationFn: (vars) => deleteScopedAccessToken(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: scopedAccessTokenKeys.list() })
      await queryClient.invalidateQueries({ queryKey: scopedAccessTokenKeys.detail(variables.id) })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete access token: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
