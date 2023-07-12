import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'
import { IntegrationConnectionsCreateVariables } from './types'

export async function createIntegrationVercelConnections({
  organizationIntegrationId,
  connection,
}: IntegrationConnectionsCreateVariables) {
  const response = await post(`${API_URL}/integrations/vercel/connections`, {
    organization_integration_id: organizationIntegrationId,
    connection,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

export type IntegrationVercelConnectionsCreateData = Awaited<
  ReturnType<typeof createIntegrationVercelConnections>
>

export const useIntegrationVercelConnectionsCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationVercelConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationVercelConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >((vars) => createIntegrationVercelConnections(vars), {
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries(integrationKeys.integrationsList()),
        queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
        queryClient.invalidateQueries(
          integrationKeys.vercelProjectList(variables.organizationIntegrationId)
        ),
        queryClient.invalidateQueries(
          integrationKeys.vercelConnectionsList(variables.organizationIntegrationId)
        ),
      ])
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
