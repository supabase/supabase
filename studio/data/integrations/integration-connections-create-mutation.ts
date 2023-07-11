import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type IntegrationConnectionsCreateVariables = {
  organizationIntegrationId: string
  connection: {
    foreign_project_id: string
    supabase_project_ref: string
    metadata: any
  }
  orgSlug: string | undefined
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationConnectionsCreateData,
    ResponseError,
    IntegrationConnectionsCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationConnectionsCreateData,
    ResponseError,
    IntegrationConnectionsCreateVariables
  >((vars) => createIntegrationConnections(vars), {
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
      if (onError === undefined) {
        toast.error(`Failed to create connection: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
