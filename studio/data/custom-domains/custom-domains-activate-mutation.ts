import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { customDomainKeys } from './keys'

export type CustomDomainActivateVariables = {
  projectRef: string
}

export async function activateCustomDomain({ projectRef }: CustomDomainActivateVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/activate`,
    {}
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type CustomDomainActivateData = Awaited<ReturnType<typeof activateCustomDomain>>

export const useCustomDomainActivateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainActivateData, unknown, CustomDomainActivateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainActivateData, unknown, CustomDomainActivateVariables>(
    (vars) => activateCustomDomain(vars),
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
