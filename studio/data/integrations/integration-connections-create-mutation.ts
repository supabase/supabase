import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export type IntegrationConnectionsCreateVariables = {
  organizationIntegrationId: string
  connections: {
    foreignProjectId: string
    supabaseProjectId: string
    integrationId: number
    metadata: any
  }[]
}

export async function createIntegrationConnections({
  organizationIntegrationId,
  connections,
}: IntegrationConnectionsCreateVariables) {
  const response = await post(`${API_URL}/integrations/vercel/connections`, {
    organizationIntegrationId,
    connections,
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
  return useMutation<
    IntegrationConnectionsCreateData,
    unknown,
    IntegrationConnectionsCreateVariables
  >((vars) => createIntegrationConnections(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
