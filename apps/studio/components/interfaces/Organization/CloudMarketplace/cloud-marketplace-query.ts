import { get, handleError } from '../../../../data/fetchers'
import type { ResponseError } from '../../../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useProfile } from '../../../../lib/profile'
import { cloudMarketplaceKeys } from './keys'

export type CloudMarketplaceOnboardingInfoVariables = {
  buyerId: string
}

export async function getCloudMarketplaceOnboardingInfo(
  { buyerId }: CloudMarketplaceOnboardingInfoVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/cloud-marketplace/buyers/{buyer_id}/onboarding-info',
    {
      params: { path: { buyer_id: buyerId } },
      signal,
    }
  )

  if (error) handleError(error)

  return data
}

export type CloudMarketplaceOnboardingInfo = Awaited<
  ReturnType<typeof getCloudMarketplaceOnboardingInfo>
>
export type CloudMarketplaceOnboardingInfoError = ResponseError

export const useCloudMarketplaceOnboardingInfoQuery = <TData = CloudMarketplaceOnboardingInfo>(
  { buyerId }: CloudMarketplaceOnboardingInfoVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    CloudMarketplaceOnboardingInfo,
    CloudMarketplaceOnboardingInfoError,
    TData
  > = {}
) => {
  const { profile } = useProfile()
  return useQuery<CloudMarketplaceOnboardingInfo, CloudMarketplaceOnboardingInfoError, TData>(
    cloudMarketplaceKeys.onboardingInfo(buyerId),
    ({ signal }) => getCloudMarketplaceOnboardingInfo({ buyerId }, signal),
    { enabled: enabled && profile !== undefined, ...options, staleTime: 30 * 60 * 1000 }
  )
}
