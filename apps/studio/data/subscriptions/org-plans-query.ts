import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { subscriptionKeys } from './keys'

export type OrgPlansVariables = {
  orgSlug?: string
}

export type OrgPlansResponse = {
  id: 'free' | 'pro' | 'team' | 'enterprise'
  name: string
  price: number
  is_current: boolean
  change_type: 'downgrade' | 'upgrade' | 'none'
  effective_at: string
}[]

export async function getOrgPlans({ orgSlug }: OrgPlansVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const response = await get(`${API_URL}/organizations/${orgSlug}/billing/plans`, { signal })
  if (response.error) throw response.error

  return response.plans as OrgPlansResponse
}

export type OrgPlansData = Awaited<ReturnType<typeof getOrgPlans>>
export type OrgPlansError = unknown

export const useOrgPlansQuery = <TData = OrgPlansData>(
  { orgSlug }: OrgPlansVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgPlansData, OrgPlansError, TData> = {}
) =>
  useQuery<OrgPlansData, OrgPlansError, TData>(
    subscriptionKeys.orgPlans(orgSlug),
    ({ signal }) => getOrgPlans({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
