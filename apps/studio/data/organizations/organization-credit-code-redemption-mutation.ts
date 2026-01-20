import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

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

type OrganizationTaxIdUpdateData = Awaited<ReturnType<typeof redeemCode>>

export const useOrganizationCreditCodeRedemptionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrganizationTaxIdUpdateData,
    ResponseError,
    OrganizationCreditCodeRedemptionVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    OrganizationTaxIdUpdateData,
    ResponseError,
    OrganizationCreditCodeRedemptionVariables
  >({
    mutationFn: (vars) => redeemCode(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to redeem code: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
