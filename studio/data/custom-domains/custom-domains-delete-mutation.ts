import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { customDomainKeys } from './keys'

export type CustomDomainDeleteVariables = {
  projectRef: string
}

export async function deleteCustomDomain({ projectRef }: CustomDomainDeleteVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await delete_(`${API_ADMIN_URL}/projects/${projectRef}/custom-hostname`, {})
  if (response.error) {
    throw response.error
  }

  return response
}

type CustomDomainDeleteData = Awaited<ReturnType<typeof deleteCustomDomain>>

export const useCustomDomainDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CustomDomainDeleteData, unknown, CustomDomainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CustomDomainDeleteData, unknown, CustomDomainDeleteVariables>(
    (vars) => deleteCustomDomain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        // we manually setQueriesData here instead of using
        // the standard invalidateQueries is the custom domains
        // endpoint doesn't immediately return the new state
        queryClient.setQueriesData(customDomainKeys.list(projectRef), () => {
          return {
            customDomain: null,
            status: '0_no_hostname_configured',
          }
        })

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
