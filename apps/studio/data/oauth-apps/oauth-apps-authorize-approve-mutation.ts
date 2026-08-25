import { useMutation } from '@tanstack/react-query'

import { getMockOAuthAppsAuthorizeRedirect, USE_MOCKS } from './mocks'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeApproveVariables = {
  id: string
  slug: string
}

export type OAuthAppsAuthorizeApproveResponse = {
  url: string
}

export async function approveOAuthAppsAuthorize({ id, slug }: OAuthAppsAuthorizeApproveVariables) {
  if (!id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization approval is not yet implemented')

  return getMockOAuthAppsAuthorizeRedirect(id, { approved: true })
}

type OAuthAppsAuthorizeApproveData = Awaited<ReturnType<typeof approveOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeApproveMutation = (
  options: Omit<
    UseCustomMutationOptions<
      OAuthAppsAuthorizeApproveData,
      ResponseError,
      OAuthAppsAuthorizeApproveVariables
    >,
    'mutationFn'
  > = {}
) => {
  return useMutation<
    OAuthAppsAuthorizeApproveData,
    ResponseError,
    OAuthAppsAuthorizeApproveVariables
  >({
    mutationFn: (vars) => approveOAuthAppsAuthorize(vars),
    ...options,
  })
}
