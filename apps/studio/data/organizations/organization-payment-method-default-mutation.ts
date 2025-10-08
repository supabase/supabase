import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, put } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationPaymentMethodDefaultVariables = {
  slug: string
  paymentMethodId: string
}

export async function markPaymentMethodAsDefault({
  slug,
  paymentMethodId,
}: OrganizationPaymentMethodDefaultVariables) {
  if (!slug) throw new Error('Slug is required')

  const { data, error } = await put(`/platform/organizations/{slug}/payments/default`, {
    body: { payment_method_id: paymentMethodId },
    params: {
      path: {
        slug,
      },
    },
  })
  if (error) throw handleError(error)
  return data
}

type OrganizationPaymentMethodDefaultData = Awaited<ReturnType<typeof markPaymentMethodAsDefault>>

export const useOrganizationPaymentMethodMarkAsDefaultMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationPaymentMethodDefaultData,
    ResponseError,
    OrganizationPaymentMethodDefaultVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationPaymentMethodDefaultData,
    ResponseError,
    OrganizationPaymentMethodDefaultVariables
  >((vars) => markPaymentMethodAsDefault(vars), {
    async onSuccess(data, variables, context) {
      const { slug, paymentMethodId } = variables
      // We do not invalidate payment methods here as endpoint data is stale for 1-2 seconds, so we handle state manually
      queryClient.setQueriesData(organizationKeys.paymentMethods(slug), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          defaultPaymentMethodId: paymentMethodId,
          data: prev.data.map((pm: any) => ({ ...pm, is_default: pm.id === paymentMethodId })),
        }
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to mark payment method as default: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
