import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import { subscriptionKeys } from 'data/subscriptions/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainDeleteVariables = {
  projectRef: string
}

export async function deleteCustomDomain({ projectRef }: CustomDomainDeleteVariables) {
  const { data, error } = await del(`/v1/projects/{ref}/custom-hostname`, {
    params: {
      path: { ref: projectRef },
    },
  })

  if (error) handleError(error)
  return data
}

type CustomDomainDeleteData = Awaited<ReturnType<typeof deleteCustomDomain>>

export const useCustomDomainDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CustomDomainDeleteData, ResponseError, CustomDomainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainDeleteData, ResponseError, CustomDomainDeleteVariables>({
    mutationFn: (vars) => deleteCustomDomain(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      // we manually setQueriesData here instead of using
      // the standard invalidateQueries is the custom domains
      // endpoint doesn't immediately return the new state
      queryClient.setQueriesData({ queryKey: customDomainKeys.list(projectRef) }, () => {
        return {
          customDomain: null,
          status: '0_no_hostname_configured',
        }
      })

      // Invalidate addons cache since the backend removes the addon when deleting the domain
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.addons(projectRef) })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete custom domain: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
