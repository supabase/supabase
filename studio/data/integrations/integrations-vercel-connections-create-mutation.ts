import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'
import { IntegrationConnectionsCreateVariables } from './integrations.types'
import { useIntegrationInstallationSnapshot } from 'state/integration-installation'

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
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationVercelConnectionsCreateData,
    ResponseError,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const snapshot = useIntegrationInstallationSnapshot()
  return useMutation<
    IntegrationVercelConnectionsCreateData,
    ResponseError,
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
    async onError(data, variables, context) {
      snapshot.setLoading(false)
      if (onError === undefined) {
        toast.error(`Failed to create connection: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
