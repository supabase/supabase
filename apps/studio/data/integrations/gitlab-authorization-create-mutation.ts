import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

export type GitLabAuthorizationCreateVariables = {
  code: string
  state: string
}

export async function createGitLabAuthorization({
  code,
  state,
}: GitLabAuthorizationCreateVariables) {
  const localState = localStorage.getItem(LOCAL_STORAGE_KEYS.GITLAB_AUTHORIZATION_STATE)

  if (state !== localState) {
    throw new Error('GitLab authorization state mismatch')
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GITLAB_AUTHORIZATION_STATE)
  }

  const { data, error } = await post('/platform/integrations/gitlab/authorization', {
    body: { code },
  })

  if (error) handleError(error)
  return data
}

type GitLabAuthorizationCreateData = Awaited<ReturnType<typeof createGitLabAuthorization>>

export const useGitLabAuthorizationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    GitLabAuthorizationCreateData,
    ResponseError,
    GitLabAuthorizationCreateVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    GitLabAuthorizationCreateData,
    ResponseError,
    GitLabAuthorizationCreateVariables
  >((vars) => createGitLabAuthorization(vars), {
    async onSuccess(data, variables, context) {
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
