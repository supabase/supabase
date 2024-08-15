import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { GitHubConnectionCreateVariables } from './integrations.types'
import { integrationKeys } from './keys'

export async function createGitHubConnection({ connection }: GitHubConnectionCreateVariables) {
  const { data, error } = await post('/platform/integrations/github/connections', {
    body: connection,
  })

  if (error) handleError(error)
  return data
}

export type GitHubConnectionCreateData = Awaited<ReturnType<typeof createGitHubConnection>>

export const useGitHubConnectionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<GitHubConnectionCreateData, ResponseError, GitHubConnectionCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<GitHubConnectionCreateData, ResponseError, GitHubConnectionCreateVariables>(
    (vars) => createGitHubConnection(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.githubConnectionsList(variables.organizationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create Github connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
