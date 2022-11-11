import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { getCustomDomains } from './custom-domains-query'
import { customDomainKeys } from './keys'

export type CustomDomainDeleteVariables = {
  projectRef: string
}

export async function deleteCustomDomain({ projectRef }: CustomDomainDeleteVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await delete_(
    `${process.env.NEXT_PUBLIC_API_ADMIN_URL}/projects/${projectRef}/custom-hostname`,
    {}
  )
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

        await queryClient.invalidateQueries(customDomainKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
