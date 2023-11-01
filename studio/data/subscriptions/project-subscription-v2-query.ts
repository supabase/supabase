import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { subscriptionKeys } from './keys'

// [Joshen TODO] To replace project-subscription-query after v2 is launched and stable to deprecate old billing ui + endpoints

export type ProjectSubscriptionVariables = {
  projectRef?: string
}

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

export type ProjectSubscriptionResponse = {
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
  billing_via_partner?: boolean
  scheduled_plan_change: {
    at: string
    target_plan: PlanId
    usage_billing_enabled: boolean
  } | null
}

export async function getProjectSubscription(
  { projectRef }: ProjectSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_URL}/projects/${projectRef}/billing/subscription`, { signal })
  if (response.error) throw response.error

  return response as ProjectSubscriptionResponse
}

export type ProjectSubscriptionData = Awaited<ReturnType<typeof getProjectSubscription>>
export type ProjectSubscriptionError = unknown

export const useProjectSubscriptionV2Query = <TData = ProjectSubscriptionData>(
  { projectRef }: ProjectSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectSubscriptionData, ProjectSubscriptionError, TData> = {}
) =>
  useQuery<ProjectSubscriptionData, ProjectSubscriptionError, TData>(
    subscriptionKeys.subscriptionV2(projectRef),
    ({ signal }) => getProjectSubscription({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useProjectSubscriptionV2Prefetch = ({ projectRef }: ProjectSubscriptionVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(subscriptionKeys.subscriptionV2(projectRef), ({ signal }) =>
        getProjectSubscription({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
