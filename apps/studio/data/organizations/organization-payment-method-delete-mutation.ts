import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationPaymentMethodDeleteVariables = {
  slug: string
  cardId: string
}

export async function deletePaymentMethod({
  slug,
  cardId,
}: OrganizationPaymentMethodDeleteVariables) {
  const { data, error } = await del(`/platform/organizations/{slug}/payments`, {
    body: {
      card_id: cardId,
    },

    params: {
      path: {
        slug,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type OrganizationPaymentMethodDeleteData = Awaited<ReturnType<typeof deletePaymentMethod>>

export const useOrganizationPaymentMethodDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationPaymentMethodDeleteData,
    ResponseError,
    OrganizationPaymentMethodDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationPaymentMethodDeleteData,
    ResponseError,
    OrganizationPaymentMethodDeleteVariables
  >((vars) => deletePaymentMethod(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries(organizationKeys.paymentMethods(slug))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete payment method: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
