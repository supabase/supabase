import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { customDomainKeys } from './keys'

export type CustomDomainCreateVariables = {
  projectRef: string
  customDomain: string
}

export async function createCustomDomain({
  projectRef,
  customDomain,
}: CustomDomainCreateVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await post(
    `${API_ADMIN_URL}/projects/${projectRef}/custom-hostname/initialize`,
    {
      custom_hostname: customDomain,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type CustomDomainCreateData = Awaited<ReturnType<typeof createCustomDomain>>

export const useCustomDomainCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainCreateData, unknown, CustomDomainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainCreateData, unknown, CustomDomainCreateVariables>(
    (vars) => createCustomDomain(vars),
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
