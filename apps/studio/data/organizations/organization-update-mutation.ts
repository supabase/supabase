import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationUpdateVariables = {
  slug: string
  name?: string
  billing_email?: string
  additional_billing_emails?: string[]
  opt_in_tags?: string[]
}

export async function updateOrganization({
  slug,
  name,
  billing_email,
  opt_in_tags,
  additional_billing_emails,
}: OrganizationUpdateVariables) {
  // @ts-ignore [Joshen] API spec is wrong
  const payload: components['schemas']['UpdateOrganizationBody'] = {}
  if (name) payload.name = name
  if (billing_email) payload.billing_email = billing_email
  if (opt_in_tags) payload.opt_in_tags = opt_in_tags as any
  if (additional_billing_emails) payload.additional_billing_emails = additional_billing_emails

  const { data, error } = await patch('/platform/organizations/{slug}', {
    params: { path: { slug } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

type OrganizationUpdateData = Awaited<ReturnType<typeof updateOrganization>>

export const useOrganizationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>(
    (vars) => updateOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        queryClient.setQueriesData(
          {
            queryKey: organizationKeys.list(),
            exact: true,
          },
          (prev: components['schemas']['OrganizationResponse'][] | undefined) => {
            if (!prev) return prev

            return prev.map((org) => {
              if (org.slug !== variables.slug) return org

              return {
                ...org,
                name: variables.name || org.name,
                billing_email: variables.billing_email || org.billing_email,
                opt_in_tags: variables.opt_in_tags || org.opt_in_tags,
              }
            })
          }
        )

        queryClient.setQueriesData(
          {
            queryKey: organizationKeys.customerProfile(data.slug),
            exact: true,
          },
          (prev: components['schemas']['CustomerResponse'] | undefined) => {
            if (!prev) return prev
            return {
              ...prev,
              additional_emails: variables.additional_billing_emails || prev.additional_emails,
            }
          }
        )

        queryClient.setQueriesData(
          {
            queryKey: organizationKeys.detail(data.slug),
            exact: true,
          },
          (prev: components['schemas']['OrganizationSlugResponse'] | undefined) => {
            if (!prev) return prev
            return {
              ...prev,
              name: variables.name || prev.name,
              billing_email: variables.billing_email || prev.billing_email,
              opt_in_tags: variables.opt_in_tags || prev.opt_in_tags,
            }
          }
        )

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
