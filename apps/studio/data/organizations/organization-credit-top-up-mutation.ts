import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { CustomerAddress, CustomerTaxId } from './types'

export type OrganizationCreditTopUpVariables = {
  payment_method_id: string
  amount: number
  slug?: string
  hcaptchaToken?: string | null
  address?: CustomerAddress | null
  tax_id?: CustomerTaxId | null
  billing_name?: string | null
}

export async function topUpCredits({
  payment_method_id,
  amount,
  slug,
  hcaptchaToken,
  address,
  tax_id,
  billing_name,
}: OrganizationCreditTopUpVariables) {
  if (!payment_method_id) {
    throw new Error('Payment method id required')
  }

  if (!hcaptchaToken) {
    throw new Error('Captcha not submitted')
  }

  if (!slug) {
    throw new Error('Slug is required')
  }

  const { data, error } = await post(`/platform/organizations/{slug}/billing/credits/top-up`, {
    params: {
      path: {
        slug,
      },
    },
    body: {
      payment_method_id,
      amount,
      hcaptcha_token: hcaptchaToken,
      address: address ?? undefined,
      tax_id: tax_id ?? undefined,
      billing_name: billing_name ?? undefined,
    },
  })

  if (error) handleError(error)

  return data
}

type OrganizationTaxIdUpdateData = Awaited<ReturnType<typeof topUpCredits>>

export const useOrganizationCreditTopUpMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationTaxIdUpdateData, ResponseError, OrganizationCreditTopUpVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<OrganizationTaxIdUpdateData, ResponseError, OrganizationCreditTopUpVariables>(
    (vars) => topUpCredits(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to top up credits: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
