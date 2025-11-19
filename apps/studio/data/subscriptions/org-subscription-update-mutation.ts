import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, put } from 'data/fetchers'
import { invoicesKeys } from 'data/invoices/keys'
import { organizationKeys } from 'data/organizations/keys'
import type { CustomerAddress, CustomerTaxId } from 'data/organizations/types'
import { usageKeys } from 'data/usage/keys'
import { toast } from 'sonner'
import type { ResponseError } from 'types/base'
import { subscriptionKeys } from './keys'
import type { SubscriptionTier } from './types'
import { UseCustomMutationOptions } from 'types'

export type OrgSubscriptionUpdateVariables = {
  slug: string
  paymentMethod?: string
  tier: SubscriptionTier
  address?: CustomerAddress | null
  tax_id?: CustomerTaxId | null
  billing_name?: string
}

export async function updateOrgSubscription({
  slug,
  tier,
  paymentMethod,
  address,
  tax_id,
  billing_name,
}: OrgSubscriptionUpdateVariables) {
  if (!slug) throw new Error('slug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: SubscriptionTier; payment_method?: string } = { tier }
  if (paymentMethod !== undefined) payload.payment_method = paymentMethod

  const { error, data } = await put(`/platform/organizations/{slug}/billing/subscription`, {
    body: {
      payment_method: payload.payment_method,
      tier: payload.tier,
      address: address ?? undefined,
      tax_id: tax_id ?? undefined,
      billing_name,
    },
    params: { path: { slug } },
  })

  if (error) handleError(error)
  return data
}

type OrgSubscriptionUpdateData = Awaited<ReturnType<typeof updateOrgSubscription>>

export const useOrgSubscriptionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrgSubscriptionUpdateData,
    ResponseError,
    OrgSubscriptionUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrgSubscriptionUpdateData, ResponseError, OrgSubscriptionUpdateVariables>({
    mutationFn: (vars) => updateOrgSubscription(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      if (!data.pending_payment_intent_secret) {
        // [Kevin] Backend can return stale data as it's waiting for the Stripe-sync to complete. Until that's solved in the backend
        // we are going back to monkey here and delay the invalidation
        await new Promise((resolve) => setTimeout(resolve, 2000))

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgSubscription(slug) }),
          queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgPlans(slug) }),
          queryClient.invalidateQueries({ queryKey: usageKeys.orgUsage(slug) }),
          queryClient.invalidateQueries({ queryKey: invoicesKeys.orgUpcomingPreview(slug) }),
          queryClient.invalidateQueries({ queryKey: organizationKeys.detail(slug) }),
          queryClient.invalidateQueries({ queryKey: organizationKeys.list() }),
          queryClient.invalidateQueries({ queryKey: organizationKeys.entitlements(slug) }),
        ])

        if (variables.paymentMethod) {
          queryClient.setQueriesData(
            { queryKey: organizationKeys.paymentMethods(slug) },
            (prev: any) => {
              if (!prev) return prev
              return {
                ...prev,
                defaultPaymentMethodId: variables.paymentMethod,
                data: prev.data.map((pm: any) => ({
                  ...pm,
                  is_default: pm.id === variables.paymentMethod,
                })),
              }
            }
          )
        }
      }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(data.message, {
          dismissible: true,
          duration: 10_000,
        })
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
