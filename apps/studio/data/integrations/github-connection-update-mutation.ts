import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

type GitHubConnectionUpdateVariables = {
  connectionId: string | number
  organizationId: number
  connection: components['schemas']['UpdateGitHubConnectionBody']
}

export async function updateConnection(
  { connectionId, connection }: GitHubConnectionUpdateVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/integrations/github/connections/{connection_id}', {
    params: { path: { connection_id: String(connectionId) } },
    signal,
    body: connection,
  })

  if (error) handleError(error)
  return data
}

type UpdateContentData = Awaited<ReturnType<typeof updateConnection>>

export const useGitHubConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, ResponseError, GitHubConnectionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateContentData, ResponseError, GitHubConnectionUpdateVariables>(
    (args) => updateConnection(args),
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
          toast.error(`Failed to update GitHub connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
