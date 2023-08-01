import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'

type DeleteVariables = {
  connectionId: string

  integrationId: string
  orgSlug: string | undefined
}

export async function deleteConnection({ connectionId }: DeleteVariables, signal?: AbortSignal) {
  const { data, error } = await del('/platform/integrations/github/connections/{connection_id}', {
    params: { path: { connection_id: connectionId } },
  })
  if (error) throw error

  return data
}

type DeleteContentData = Awaited<ReturnType<typeof deleteConnection>>

export const useIntegrationsGitHubInstalledConnectionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteContentData, ResponseError, DeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DeleteContentData, ResponseError, DeleteVariables>(
    (args) => deleteConnection(args),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(integrationKeys.integrationsList()),
          queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
          queryClient.invalidateQueries(integrationKeys.githubRepoList(variables.integrationId)),
          queryClient.invalidateQueries(
            integrationKeys.githubConnectionsList(variables.integrationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete Github connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
