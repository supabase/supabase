import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { integrationKeys } from './keys'

export async function deleteGitHubAuthorization(signal?: AbortSignal) {
  const { data, error } = await del('/platform/integrations/github/authorization', { signal })

  if (error) handleError(error)
  return data
}

type GitHubAuthorizationDeleteData = Awaited<ReturnType<typeof deleteGitHubAuthorization>>

export const useGitHubAuthorizationDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<GitHubAuthorizationDeleteData, ResponseError, void>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<GitHubAuthorizationDeleteData, ResponseError, void>({
    mutationFn: () => deleteGitHubAuthorization(),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: integrationKeys.githubAuthorization(),
        }),
        queryClient.invalidateQueries({
          queryKey: integrationKeys.githubRepositoriesList(),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to remove GitHub authorization: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
