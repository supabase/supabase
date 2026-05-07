import { useQuery } from '@tanstack/react-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { cloudMarketplaceKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useProfile } from '@/lib/profile'

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
  }: UseCustomQueryOptions<
    CloudMarketplaceOnboardingInfo,
    CloudMarketplaceOnboardingInfoError,
    TData
  > = {}
) => {
  const { profile } = useProfile()
  return useQuery<CloudMarketplaceOnboardingInfo, CloudMarketplaceOnboardingInfoError, TData>({
    queryKey: cloudMarketplaceKeys.onboardingInfo(buyerId),
    queryFn: ({ signal }) => getCloudMarketplaceOnboardingInfo({ buyerId }, signal),
    enabled: enabled && profile !== undefined,
    ...options,
    staleTime: 30 * 60 * 1000,
  })
}

export type CloudMarketplaceContractEligibilityVariables = {
  buyerId: string
}

export async function getCloudMarketplaceContractLinkingEligibility(
  { buyerId }: CloudMarketplaceContractEligibilityVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/cloud-marketplace/buyers/{buyer_id}/contract-linking-eligibility',
    {
      params: { path: { buyer_id: buyerId } },
      signal,
    }
  )

  if (error) handleError(error)

  return data
}

export type CloudMarketplaceContractLinkingEligibility = Awaited<
  ReturnType<typeof getCloudMarketplaceContractLinkingEligibility>
>
export type CloudMarketplaceContractLinkingIneligibilityReason =
  CloudMarketplaceContractLinkingEligibility['eligibility']['reasons'][0]

export type CloudMarketplaceContractEligibilityError = ResponseError

export const useCloudMarketplaceContractLinkingEligibilityQuery = <
  TData = CloudMarketplaceContractLinkingEligibility,
>(
  { buyerId }: CloudMarketplaceContractEligibilityVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    CloudMarketplaceContractLinkingEligibility,
    CloudMarketplaceContractEligibilityError,
    TData
  > = {}
) => {
  const { profile } = useProfile()
  return useQuery<
    CloudMarketplaceContractLinkingEligibility,
    CloudMarketplaceContractEligibilityError,
    TData
  >({
    queryKey: cloudMarketplaceKeys.contractLinkingEligibility(buyerId),
    queryFn: ({ signal }) => getCloudMarketplaceContractLinkingEligibility({ buyerId }, signal),
    enabled: enabled && profile !== undefined,
    ...options,
    staleTime: 60 * 1000,
  })
}
