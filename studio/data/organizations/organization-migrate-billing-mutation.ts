import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationBillingMigrationVariables = {
  organizationSlug?: string
  tier?: string
  paymentMethodId?: string
}

export async function migrateBilling({
  organizationSlug,
  tier,
  paymentMethodId,
}: OrganizationBillingMigrationVariables) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string; payment_method_id?: string } = {
    tier,
    payment_method_id: paymentMethodId,
  }

  const response = await post(
    `${API_URL}/organizations/${organizationSlug}/org-billing-migration`,
    payload
  )
  if (response.error) throw response.error

  return response
}

type OrganizationBillingMigrationData = Awaited<ReturnType<typeof migrateBilling>>

export const useOrganizationBillingMigrationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationBillingMigrationData,
    ResponseError,
    OrganizationBillingMigrationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationBillingMigrationData,
    ResponseError,
    OrganizationBillingMigrationVariables
  >((vars) => migrateBilling(vars), {
    async onSuccess(data, variables, context) {
      const { organizationSlug } = variables
      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.detail(organizationSlug)),
        queryClient.invalidateQueries(organizationKeys.list()),
        queryClient.invalidateQueries(organizationKeys.freeProjectLimitCheck(organizationSlug)),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to migrate billing: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
