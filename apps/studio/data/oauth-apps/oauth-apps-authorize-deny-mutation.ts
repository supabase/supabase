import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getMockOAuthAppsAuthorizeRedirect, USE_MOCKS } from './mocks'
import type { OAuthAppsAuthorizeRedirect } from './types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeDenyVariables = {
  slug: string
  auth_id: string
}

export type OAuthAppsAuthorizeDenyResponse = OAuthAppsAuthorizeRedirect

export async function denyOAuthAppsAuthorize({ slug, auth_id }: OAuthAppsAuthorizeDenyVariables) {
  if (!auth_id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization denial is not yet implemented')

  return getMockOAuthAppsAuthorizeRedirect(auth_id, { approved: false })
}

type OAuthAppsAuthorizeDenyData = Awaited<ReturnType<typeof denyOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeDenyMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthAppsAuthorizeDenyData,
    ResponseError,
    OAuthAppsAuthorizeDenyVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<OAuthAppsAuthorizeDenyData, ResponseError, OAuthAppsAuthorizeDenyVariables>({
    mutationFn: (vars) => denyOAuthAppsAuthorize(vars),
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to deny access to OAuth app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
