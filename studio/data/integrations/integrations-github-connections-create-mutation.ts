import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'
import { IntegrationConnectionsCreateVariables } from './types'

export async function createIntegrationGitHubConnections({
  organizationIntegrationId,
  connection,
}: IntegrationConnectionsCreateVariables) {
  const response = await post(`${API_URL}/integrations/github/connections`, {
    organization_integration_id: organizationIntegrationId,
    connection,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

export type IntegrationGitHubConnectionsCreateData = Awaited<
  ReturnType<typeof createIntegrationGitHubConnections>
>

export const useIntegrationGitHubConnectionsCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationGitHubConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationGitHubConnectionsCreateData,
    unknown,
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
    ...options,
  })
}
