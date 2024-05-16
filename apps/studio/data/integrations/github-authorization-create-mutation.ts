import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type GitHubAuthorizationCreateVariables = {
  code: string
}

export async function createGitHubAuthorization({ code }: GitHubAuthorizationCreateVariables) {
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
  UseMutationOptions<
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
  >((vars) => createGitHubAuthorization(vars), {
    async onSuccess(data, variables, context) {
      // const { projectRef, id } = variables

      // await Promise.all([
      //   queryClient.invalidateQueries(githubAuthorizationKeys.list(projectRef)),
      //   queryClient.invalidateQueries(githubAuthorizationKeys.githubAuthorization(projectRef, id)),
      // ])

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
