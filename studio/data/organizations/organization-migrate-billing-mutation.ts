import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationBillingMigrationVariables = {
  organizationSlug?: string
  tier?: string
}

type OrganizationBillingMigrationError = {
  message: string
}

export async function migrateBilling({
  organizationSlug,
  tier,
}: OrganizationBillingMigrationVariables) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string } = {
    tier,
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
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationBillingMigrationData,
    OrganizationBillingMigrationError,
    OrganizationBillingMigrationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationBillingMigrationData,
    OrganizationBillingMigrationError,
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
    ...options,
  })
}
