import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'
import { castOrganizationResponseToOrganization } from './organizations-query'

export type OrganizationCreateVariables = {
  name: string
  kind?: string
  size?: string
  tier: 'tier_payg' | 'tier_pro' | 'tier_free' | 'tier_team' | 'tier_enterprise'
  payment_method?: string
  billing_name?: string
  address?: components['schemas']['CreateOrganizationBody']['address']
  tax_id?: components['schemas']['CreateOrganizationBody']['tax_id']
}

export async function createOrganization({
  name,
  kind,
  size,
  tier,
  payment_method,
  address,
  billing_name,
  tax_id,
}: OrganizationCreateVariables) {
  const { data, error } = await post('/platform/organizations', {
    body: {
      name,
      kind,
      size,
      tier,
      payment_method,
      address,
      billing_name,
      tax_id,
    },
  })

  if (error) handleError(error)
  return data
}

type OrganizationCreateData = Awaited<ReturnType<typeof createOrganization>>

export const useOrganizationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationCreateData, ResponseError, OrganizationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationCreateData, ResponseError, OrganizationCreateVariables>(
    (vars) => createOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        if (data && !('pending_payment_intent_secret' in data)) {
          // [Joshen] We're manually updating the query client here as the org's subscription is
          // created async, and the invalidation will happen too quick where the GET organizations
          // endpoint will error out with a 500 since the subscription isn't created yet.
          queryClient.setQueriesData(
            {
              queryKey: organizationKeys.list(),
              exact: true,
            },
            (prev: any) => {
              if (!prev) return prev
              return [...prev, castOrganizationResponseToOrganization(data)]
            }
          )

          await queryClient.invalidateQueries(permissionKeys.list())
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
