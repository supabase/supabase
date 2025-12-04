import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainCreateVariables = {
  projectRef: string
  customDomain: string
}

export async function createCustomDomain({
  projectRef,
  customDomain,
}: CustomDomainCreateVariables) {
  const { data, error } = await post(`/v1/projects/{ref}/custom-hostname/initialize`, {
    params: { path: { ref: projectRef } },
    body: { custom_hostname: customDomain },
  })

  if (error) handleError(error)
  return data
}

type CustomDomainCreateData = Awaited<ReturnType<typeof createCustomDomain>>

export const useCustomDomainCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CustomDomainCreateData, ResponseError, CustomDomainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainCreateData, ResponseError, CustomDomainCreateVariables>({
    mutationFn: (vars) => createCustomDomain(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: customDomainKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create custom domain: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
