import { useMutation } from '@tanstack/react-query'
import { components } from 'api-types/types/platform'
import { toast } from 'sonner'

import { isOAuthRoleValidationError } from './types'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

type OAuthAuthorizeApproveRequest = components['schemas']['ApproveAuthorizationBody']
export type OAuthAppsAuthorizeApproveVariables = {
  slug?: string
  auth_id?: string
  body: OAuthAuthorizeApproveRequest
}

export async function approveOAuthAppsAuthorize({
  slug,
  auth_id,
  body,
}: OAuthAppsAuthorizeApproveVariables) {
  if (!auth_id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  const { data, error } = await post('/platform/organizations/{slug}/oauth/authorizations/{id}', {
    params: { path: { slug, id: auth_id } },
    body,
  })
  if (error && isOAuthRoleValidationError(error)) {
    throw error
  }
  if (error) handleError(error)
  return data
}

export type OAuthAppsAuthorizeApproveData = Awaited<ReturnType<typeof approveOAuthAppsAuthorize>>

export const useOAuthAppsAuthorizeApproveMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthAppsAuthorizeApproveData,
    StudioError,
    OAuthAppsAuthorizeApproveVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    OAuthAppsAuthorizeApproveData,
    StudioError,
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
