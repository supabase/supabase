import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationPaymentMethodDeleteVariables = {
  slug: string
  cardId: string
}

export async function deletePaymentMethod({
  slug,
  cardId,
}: OrganizationPaymentMethodDeleteVariables) {
  const response = await delete_(`${API_URL}/organizations/${slug}/payments`, { card_id: cardId })
  if (response.error) throw response.error
  return response
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
