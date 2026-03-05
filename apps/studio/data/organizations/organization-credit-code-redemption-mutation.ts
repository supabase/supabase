import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

import { subscriptionKeys } from '../subscriptions/keys'
import { organizationKeys } from './keys'

export type OrganizationCreditCodeRedemptionVariables = {
  code: string
  slug?: string
  hcaptchaToken?: string | null
}

export async function redeemCode({
  hcaptchaToken,
  code,
  slug,
}: OrganizationCreditCodeRedemptionVariables) {
  if (!hcaptchaToken) {
    throw new Error('Captcha not submitted')
  }

  if (!slug) {
    throw new Error('Slug is required')
  }

  const { data, error } = await post(`/platform/organizations/{slug}/billing/credits/redeem`, {
    params: {
      path: {
        slug,
      },
    },
    body: {
      hcaptcha_token: hcaptchaToken,
      code,
    },
  })

  if (error) handleError(error)

  return data
}

type RedeemCodeData = Awaited<ReturnType<typeof redeemCode>>

export const useOrganizationCreditCodeRedemptionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    RedeemCodeData,
    ResponseError,
    OrganizationCreditCodeRedemptionVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<RedeemCodeData, ResponseError, OrganizationCreditCodeRedemptionVariables>({
    mutationFn: (vars) => redeemCode(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.customerProfile(slug) }),
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgSubscription(slug) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError !== undefined) {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
