import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'
import { ResponseError } from 'types'

export type OrganizationPaymentMethodDeleteVariables = {
  slug: string
  cardId: string
}

export async function deleteOrganizationMember({
  slug,
  cardId,
}: OrganizationPaymentMethodDeleteVariables) {
  const response = await delete_(`${API_URL}/organizations/${slug}/payments`, { card_id: cardId })
  if (response.error) throw response.error
  return response
}

type OrganizationPaymentMethodDeleteData = Awaited<ReturnType<typeof deleteOrganizationMember>>

export const useOrganizationPaymentMethodDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationPaymentMethodDeleteData,
    unknown,
    OrganizationPaymentMethodDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationPaymentMethodDeleteData,
    unknown,
    OrganizationPaymentMethodDeleteVariables
  >((vars) => deleteOrganizationMember(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries(organizationKeys.paymentMethods(slug))
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
