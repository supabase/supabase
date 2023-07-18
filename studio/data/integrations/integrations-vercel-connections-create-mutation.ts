import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { post } from 'data/fetchers'
import { integrationKeys } from './keys'
import { IntegrationConnectionsCreateVariables } from './types'

export async function createIntegrationVercelConnections({
  organizationIntegrationId,
  connection,
}: IntegrationConnectionsCreateVariables) {
  const { data, error } = await post('/platform/integrations/vercel/connections', {
    body: {
      organization_integration_id: organizationIntegrationId,
      connection: {
        foreign_project_id: connection.foreign_project_id,
        supabase_project_ref: connection.supabase_project_ref,
        metadata: connection.metadata,
      },
    },
  })
  if (error) {
    throw error
  }

  return data
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
