import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

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
  const { data, error } = await post('/platform/integrations/vercel', {
    body: {
      code,
      configuration_id: configurationId,
      organization_slug: orgSlug,
      metadata: metadata as Record<string, never>,
      source,
      teamId,
    },
  })

  if (error) handleError(error)
  // [Joshen] API isn't typed on this endpoint
  // https://github.com/supabase/infrastructure/blob/develop/api/src/routes/platform/integrations/vercel/vercel-integration.controller.ts#L50
  return data as { id: string }
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
