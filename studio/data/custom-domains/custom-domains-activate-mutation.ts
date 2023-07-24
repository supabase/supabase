import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainActivateVariables = {
  projectRef: string
}

export async function activateCustomDomain({ projectRef }: CustomDomainActivateVariables) {
  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/activate`,
    {}
  )

  if (response.error) throw response.error
  return response
}

type CustomDomainActivateData = Awaited<ReturnType<typeof activateCustomDomain>>

export const useCustomDomainActivateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainActivateData, ResponseError, CustomDomainActivateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainActivateData, ResponseError, CustomDomainActivateVariables>(
    (vars) => activateCustomDomain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(customDomainKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to activate custom domain: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
