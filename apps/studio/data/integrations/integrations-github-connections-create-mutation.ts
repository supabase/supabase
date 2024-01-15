import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'
import { IntegrationConnectionsCreateVariables } from './integrations.types'

export async function createIntegrationGitHubConnections({
  organizationIntegrationId,
  connection,
}: IntegrationConnectionsCreateVariables) {
  const { data, error } = await post('/platform/integrations/github/connections', {
    body: {
      organization_integration_id: organizationIntegrationId,
      connection,
    },
  })
  if (error) {
    throw error
  }

  return data
}

export type IntegrationGitHubConnectionsCreateData = Awaited<
  ReturnType<typeof createIntegrationGitHubConnections>
>

export const useIntegrationGitHubConnectionsCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationGitHubConnectionsCreateData,
    ResponseError,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationGitHubConnectionsCreateData,
    ResponseError,
    IntegrationConnectionsCreateVariables
  >((vars) => createIntegrationGitHubConnections(vars), {
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries(integrationKeys.integrationsList()),
        queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
        queryClient.invalidateQueries(
          integrationKeys.githubRepoList(variables.organizationIntegrationId)
        ),
        queryClient.invalidateQueries(
          integrationKeys.githubConnectionsList(variables.organizationIntegrationId)
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
  })
}
