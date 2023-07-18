import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { customDomainKeys } from './keys'
import { toast } from 'react-hot-toast'
import { ResponseError } from 'types'

export type CustomDomainReverifyVariables = {
  projectRef: string
}

export async function reverifyCustomDomain({ projectRef }: CustomDomainReverifyVariables) {
  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/reverify`,
    {}
  )

  if (response.error) throw response.error
  return response
}

type CustomDomainReverifyData = Awaited<ReturnType<typeof reverifyCustomDomain>>

export const useCustomDomainReverifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainReverifyData, ResponseError, CustomDomainReverifyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainReverifyData, ResponseError, CustomDomainReverifyVariables>(
    (vars) => reverifyCustomDomain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(customDomainKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to reverify custom domain: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
