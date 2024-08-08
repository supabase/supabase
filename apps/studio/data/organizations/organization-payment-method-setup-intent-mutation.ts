import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrganizationPaymentMethodSetupIntentVariables = {
  slug: string
  hcaptchaToken: string
}

export async function setupPaymentMethodIntent({
  slug,
  hcaptchaToken,
}: OrganizationPaymentMethodSetupIntentVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/payments/setup-intent', {
    // @ts-ignore [Joshen] API seems to be having the wrong spec
    params: { path: { slug } },
    // @ts-ignore [Joshen] API seems to be having the wrong spec
    body: { hcaptchaToken },
  })
  if (error) handleError(error)
  return data
}

type OrganizationPaymentMethodSetupIntentData = Awaited<ReturnType<typeof setupPaymentMethodIntent>>

export const useOrganizationPaymentMethodSetupIntent = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationPaymentMethodSetupIntentData,
    ResponseError,
    OrganizationPaymentMethodSetupIntentVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    OrganizationPaymentMethodSetupIntentData,
    ResponseError,
    OrganizationPaymentMethodSetupIntentVariables
  >((vars) => setupPaymentMethodIntent(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to setup intent: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
