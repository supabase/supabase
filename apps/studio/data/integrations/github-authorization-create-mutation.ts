import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { integrationKeys } from './keys'

export type GitHubAuthorizationCreateVariables = {
  code: string
  state: string
}

export async function createGitHubAuthorization({
  code,
  state,
}: GitHubAuthorizationCreateVariables) {
  const localState = localStorage.getItem(LOCAL_STORAGE_KEYS.GITHUB_AUTHORIZATION_STATE)

  if (state !== localState) {
    throw new Error('GitHub authorization state mismatch')
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GITHUB_AUTHORIZATION_STATE)
  }

  const { data, error } = await post('/platform/integrations/github/authorization', {
    body: { code },
  })

  if (error) handleError(error)
  return data
}

type GitHubAuthorizationCreateData = Awaited<ReturnType<typeof createGitHubAuthorization>>

export const useGitHubAuthorizationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    GitHubAuthorizationCreateData,
    ResponseError,
    GitHubAuthorizationCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    GitHubAuthorizationCreateData,
    ResponseError,
    GitHubAuthorizationCreateVariables
  >({
    mutationFn: (vars) => createGitHubAuthorization(vars),
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
        toast.error(`Failed to mutate: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
