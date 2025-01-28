import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { GitLabConnectionCreateVariables } from './integrations.types'
import { integrationKeys } from './keys'

export async function createGitLabConnection({ connection }: GitLabConnectionCreateVariables) {
  const { data, error } = await post('/platform/integrations/gitlab/connections', {
    body: connection,
  })

  if (error) handleError(error)
  return data
}

export type GitLabConnectionCreateData = Awaited<ReturnType<typeof createGitLabConnection>>

export const useGitLabConnectionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<GitLabConnectionCreateData, ResponseError, GitLabConnectionCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<GitLabConnectionCreateData, ResponseError, GitLabConnectionCreateVariables>(
    (vars) => createGitLabConnection(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.gitlabConnectionsList(variables.organizationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create GitLab connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
