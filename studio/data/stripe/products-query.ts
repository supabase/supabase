import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { stripeKeys } from './keys'
import { SubscriptionAddon } from 'components/interfaces/Billing/AddOns/AddOns.types'

export type StripeProductsResponse = {
  tiers: SubscriptionAddon[]
  addons: SubscriptionAddon[]
}

export async function getStripeProducts(signal?: AbortSignal) {
  const response = await get(`${API_URL}/stripe/products`, {
    signal,
  })
  if (response.error) throw response.error
  return response as StripeProductsResponse
}

export type StripeProductsData = Awaited<ReturnType<typeof getStripeProducts>>
export type StripeProductsError = unknown

export const useStripeProductsQuery = <TData = StripeProductsData>({
  enabled = true,
  ...options
}: UseQueryOptions<StripeProductsData, StripeProductsError, TData> = {}) =>
  useQuery<StripeProductsData, StripeProductsError, TData>(
    stripeKeys.products(),
    ({ signal }) => getStripeProducts(signal),
    { enabled, ...options }
  )
