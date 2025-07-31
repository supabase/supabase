import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { orgSSOKeys } from './keys'

export type OrgSSOConfigVariables = {
  orgSlug?: string
}

export async function getOrgSSOConfig({ orgSlug }: OrgSSOConfigVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/sso', {
    params: { path: { slug: orgSlug } },
    signal,
  })

  if (error) {
    const ssoNotSetUp =
      (error as any)?.code === 404 &&
      (error as any)?.message?.includes('Failed to get the SSO Provider')

    if (ssoNotSetUp) {
      return null
    } else {
      handleError(error)
    }
  }
  return data
}

export type OrgSSOConfigData = Awaited<ReturnType<typeof getOrgSSOConfig>>
export type OrgSSOConfigError = ResponseError

export const useOrgSSOConfigQuery = <TData = OrgSSOConfigData>(
  { orgSlug }: OrgSSOConfigVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgSSOConfigData, OrgSSOConfigError, TData> = {}
) =>
  useQuery<OrgSSOConfigData, OrgSSOConfigError, TData>(
    orgSSOKeys.orgSSOConfig(orgSlug),
    ({ signal }) => getOrgSSOConfig({ orgSlug }, signal),
    {
      enabled: enabled && IS_PLATFORM && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
