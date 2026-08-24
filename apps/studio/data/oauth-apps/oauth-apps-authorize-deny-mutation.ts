import { useMutation } from '@tanstack/react-query'

import { getMockOAuthAppsAuthorizeRedirect } from './mocks'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeDenyVariables = {
  id: string
  slug: string
}

export type OAuthAppsAuthorizeDenyResponse = {
  url: string
}

export async function denyOAuthAppsAuthorize({ id, slug }: OAuthAppsAuthorizeDenyVariables) {
  if (!id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')

  return getMockOAuthAppsAuthorizeRedirect(id, { approved: false })
}

type OAuthAppsAuthorizeDenyData = Awaited<ReturnType<typeof denyOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeDenyMutation = (
  options: Omit<
    UseCustomMutationOptions<
      OAuthAppsAuthorizeDenyData,
      ResponseError,
      OAuthAppsAuthorizeDenyVariables
    >,
    'mutationFn'
  > = {}
) => {
  return useMutation<OAuthAppsAuthorizeDenyData, ResponseError, OAuthAppsAuthorizeDenyVariables>({
    mutationFn: (vars) => denyOAuthAppsAuthorize(vars),
    ...options,
  })
}
