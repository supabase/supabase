import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getMockOAuthAppsAuthorizeApproveResult, USE_MOCKS } from './mocks'
import type { OAuthAppsAuthorizeApproveResult, OAuthAuthorizeApproveRequest } from './types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeApproveVariables = {
  slug: string
  auth_id: string
  body: OAuthAuthorizeApproveRequest
}

export type OAuthAppsAuthorizeApproveResponse = OAuthAppsAuthorizeApproveResult

export async function approveOAuthAppsAuthorize({
  slug,
  auth_id,
  body,
}: OAuthAppsAuthorizeApproveVariables): Promise<OAuthAppsAuthorizeApproveResult> {
  if (!auth_id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization approval is not yet implemented')

  return getMockOAuthAppsAuthorizeApproveResult(auth_id, { slug, projectRefs: body.project_refs })
}

type OAuthAppsAuthorizeApproveData = Awaited<ReturnType<typeof approveOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeApproveMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthAppsAuthorizeApproveData,
    ResponseError,
    OAuthAppsAuthorizeApproveVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    OAuthAppsAuthorizeApproveData,
    ResponseError,
    OAuthAppsAuthorizeApproveVariables
  >({
    mutationFn: (vars) => approveOAuthAppsAuthorize(vars),
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to authorize access to OAuth app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
