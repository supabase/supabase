import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthIntegrationInstallVariables = {
  projectRef: string
  id: string
}

export async function installOAuthIntegration({
  projectRef,
  id,
}: OAuthIntegrationInstallVariables) {
  const { data, error } = await post('/platform/integrations/partners/{ref}/{listing_id}', {
    params: { path: { ref: projectRef, listing_id: id } },
  })

  if (error) handleError(error)
  return data
}

type OAuthIntegrationInstallData = Awaited<ReturnType<typeof installOAuthIntegration>>

export const useInstallOAuthIntegrationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthIntegrationInstallData,
    ResponseError,
    OAuthIntegrationInstallVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<OAuthIntegrationInstallData, ResponseError, OAuthIntegrationInstallVariables>({
    mutationFn: (vars) => installOAuthIntegration(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to start OAuth integration installation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
