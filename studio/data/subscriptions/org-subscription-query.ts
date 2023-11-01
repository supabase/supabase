import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { subscriptionKeys } from './keys'
import { ResponseError } from 'types'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

export type ProjectAddon = {
  addons: {
    type: 'custom_domain' | 'compute_instance' | 'pitr'
    variant: {
      identifier: string
      name: string
      price: number
      price_description: string
      price_interval: string
      price_type: string
    }
  }[]
  name: string
  ref: string
}

export type OrgSubscription = {
  billing_cycle_anchor: number
  current_period_start: number
  current_period_end: number
  next_invoice_at: number
  usage_billing_enabled: boolean
  plan: {
    id: PlanId
    name: string
    price: number
  }
  addons: {
    name: string
    supabase_prod_id: string
    price: number
  }[]
  usage_fees: {
    metric: string
    pricingStrategy: 'UNIT' | 'PACKAGE'
    pricingOptions: {
      perUnitPrice?: number
      packagePrice?: number
      packageSize?: number
      freeUnits: number
    }
  }[]
  payment_method_id?: string
  payment_method_type: 'invoice' | 'card' | 'none'
  payment_method_card_details?: {
    last_4_digits: string
    brand: string
    expiry_month: number
    expiry_year: number
  }
  project_addons: ProjectAddon[]
  billing_via_partner?: boolean
  scheduled_plan_change: {
    at: string
    target_plan: PlanId
    usage_billing_enabled: boolean
  } | null
}

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const response = await get(`${API_URL}/organizations/${orgSlug}/billing/subscription`, { signal })
  if (response.error) throw response.error

  return response as OrgSubscription
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) =>
  useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>(
    subscriptionKeys.orgSubscription(orgSlug),
    ({ signal }) => getOrgSubscription({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
