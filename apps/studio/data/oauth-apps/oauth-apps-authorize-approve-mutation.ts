import { useMutation } from '@tanstack/react-query'

import {
  getMockOAuthAppsAuthorizeGrant,
  getMockOAuthAppsAuthorizeRedirect,
  USE_MOCKS,
} from './mocks'
import type { OAuthAppsAuthorizeOrganizationProject } from './oauth-apps-authorize-organization-projects-query'
import type { OAuthScopeGroup } from './types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppsAuthorizeApproveVariables = {
  id: string
  slug: string
  projectRefs: string[]
}

export type OAuthAppsAuthorizeGrant = {
  email: string
  role: string
  organization_slug: string
  projects: OAuthAppsAuthorizeOrganizationProject[]
  scope_groups: OAuthScopeGroup[]
}

export type OAuthAppsAuthorizeApproveResponse = {
  url: string
  grant: OAuthAppsAuthorizeGrant
}

export async function approveOAuthAppsAuthorize({
  id,
  slug,
  projectRefs,
}: OAuthAppsAuthorizeApproveVariables) {
  if (!id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization approval is not yet implemented')

  await new Promise((resolve) => setTimeout(resolve, 300))
  const { url } = getMockOAuthAppsAuthorizeRedirect(id, { approved: true })
  const grant = getMockOAuthAppsAuthorizeGrant(id, slug, projectRefs)
  return { url, grant }
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
