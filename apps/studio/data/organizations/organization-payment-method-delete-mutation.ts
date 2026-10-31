import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { organizationKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => deletePaymentMethod(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries({ queryKey: organizationKeys.paymentMethods(slug) })
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
