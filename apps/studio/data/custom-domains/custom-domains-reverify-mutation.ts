import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainReverifyVariables = {
  projectRef: string
}

export async function reverifyCustomDomain({ projectRef }: CustomDomainReverifyVariables) {
  const { data, error } = await post(`/v1/projects/{ref}/custom-hostname/reverify`, {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
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
