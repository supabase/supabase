import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { customDomainKeys } from './keys'

export type CustomDomainReverifyVariables = {
  projectRef: string
}

export async function reverifyCustomDomain({ projectRef }: CustomDomainReverifyVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/reverify`,
    {}
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type CustomDomainReverifyData = Awaited<ReturnType<typeof reverifyCustomDomain>>

export const useCustomDomainReverifyMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainReverifyData, unknown, CustomDomainReverifyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainReverifyData, unknown, CustomDomainReverifyVariables>(
    (vars) => reverifyCustomDomain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(customDomainKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
