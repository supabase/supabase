import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainCreateVariables = {
  projectRef: string
  customDomain: string
}

export async function createCustomDomain({
  projectRef,
  customDomain,
}: CustomDomainCreateVariables) {
  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/initialize`,
    { custom_hostname: customDomain }
  )

  if (response.error) throw response.error
  return response
}

type CustomDomainCreateData = Awaited<ReturnType<typeof createCustomDomain>>

export const useCustomDomainCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainCreateData, ResponseError, CustomDomainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainCreateData, ResponseError, CustomDomainCreateVariables>(
    (vars) => createCustomDomain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(customDomainKeys.list(projectRef))
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
    }
  )
}
