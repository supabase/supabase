import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { patch, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrganizationMfaToggleVariables = {
  slug: string
  setEnforced: boolean
}

export async function toggleOrganizationMfa({ slug, setEnforced }: OrganizationMfaToggleVariables) {
  const { enforced, error } = await patch('/platform/organizations/{slug}/members/mfa/enforcement', {
    params: { path: { slug } },
    body: { enforced: setEnforced },
  })
  if (error) handleError(error)
  return enforced
}

type OrganizationMfaToggleData = Awaited<ReturnType<typeof toggleOrganizationMfa>>

export const useOrganizationMfaToggleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationMfaToggleData, ResponseError, OrganizationMfaToggleVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<OrganizationMfaToggleData, ResponseError, OrganizationMfaToggleVariables>(
    (vars) => toggleOrganizationMfa(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update MFA enforcement: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
