import { useMutation } from '@tanstack/react-query'

import { getMockOAuthAppsAuthorizeRedirect, USE_MOCKS } from './mocks'
import type { OAuthAppsAuthorizeRedirect } from './types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeApproveVariables = {
  slug: string
  auth_id: string
  project_refs: string[]
}

export type OAuthAppsAuthorizeApproveResponse = OAuthAppsAuthorizeRedirect

export async function approveOAuthAppsAuthorize({
  slug,
  auth_id,
  project_refs,
}: OAuthAppsAuthorizeApproveVariables) {
  if (!auth_id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!project_refs?.length) throw new Error('At least one project is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization approval is not yet implemented')

  return getMockOAuthAppsAuthorizeRedirect(auth_id, { approved: true })
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
