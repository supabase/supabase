import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

export type IntegrationConnectionsCreateVariables = {
  organizationIntegrationId: string
  connection: {
    foreign_project_id: string
    supabase_project_ref: string
    integration_id: number
    metadata: any
  }
  orgId: number | undefined
}

export async function createIntegrationConnections({
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

type IntegrationConnectionsCreateData = Awaited<ReturnType<typeof createIntegrationConnections>>

export const useIntegrationConnectionsCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >((vars) => createIntegrationConnections(vars), {
    async onSuccess(data, variables, context) {
      await Promise.all([queryClient.invalidateQueries(integrationKeys.list(variables.orgId))])
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
