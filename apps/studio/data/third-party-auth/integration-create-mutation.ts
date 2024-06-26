import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { keys } from './keys'

export type CreateThirdPartyAuthVariables = {
  projectRef: string
  customJwks?: Record<string, never>
  jwksUrl?: string
  oidcIssuerUrl?: string
}

export async function createThirdPartyIntegration({
  projectRef,
  customJwks,
  jwksUrl,
  oidcIssuerUrl,
}: CreateThirdPartyAuthVariables) {
  const { data, error } = await post(`/v1/projects/{ref}/config/auth/third-party-auth`, {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      custom_jwks: customJwks,
      jwks_url: jwksUrl,
      oidc_issuer_url: oidcIssuerUrl,
    },
  })
  if (error) handleError(error)

  return data
}

type ThirdPartyIntegrationCreateData = Awaited<ReturnType<typeof createThirdPartyIntegration>>

export const useCreateThirdPartyAuthIntegrationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ThirdPartyIntegrationCreateData, ResponseError, CreateThirdPartyAuthVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ThirdPartyIntegrationCreateData, ResponseError, CreateThirdPartyAuthVariables>(
    (vars) => createThirdPartyIntegration(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(keys.integrations(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create third party auth integration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
