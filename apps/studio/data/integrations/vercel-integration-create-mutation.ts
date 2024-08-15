import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'
import { toast } from 'react-hot-toast'
import type { ResponseError } from 'types'

export type VercelIntegrationCreateVariables = {
  code: string
  configurationId: string
  orgSlug: string
  metadata: { [key: string]: string }
  source: string
  // teamId is only present when a team is being installed
  // personal accounts (hobby) will not have this value defined
  teamId?: string
}

export async function createVercelIntegration({
  code,
  configurationId,
  orgSlug,
  metadata,
  source,
  teamId,
}: VercelIntegrationCreateVariables) {
  const response = await post(`${API_URL}/integrations/vercel`, {
    code,
    configuration_id: configurationId,
    organization_slug: orgSlug,
    metadata,
    source,
    teamId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type VercelIntegrationCreateData = Awaited<ReturnType<typeof createVercelIntegration>>

export const useVercelIntegrationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<VercelIntegrationCreateData, ResponseError, VercelIntegrationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<VercelIntegrationCreateData, ResponseError, VercelIntegrationCreateVariables>(
    (vars) => createVercelIntegration(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(integrationKeys.integrationsList()),
          queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
          queryClient.invalidateQueries(integrationKeys.vercelProjectList(data.id)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create Vercel integration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
