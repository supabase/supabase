import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { orgSSOKeys } from './keys'

export type SSOConfigCreateVariables = {
  slug: string
  config: components['schemas']['CreateSSOProviderBody']
}

export async function createSSOConfig({ slug, config }: SSOConfigCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/sso', {
    params: { path: { slug } },
    body: config,
  })

  if (error) handleError(error)
  return data
}

type SSOConfigCreateData = Awaited<ReturnType<typeof createSSOConfig>>

export const useSSOConfigCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SSOConfigCreateData, ResponseError, SSOConfigCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSOConfigCreateData, ResponseError, SSOConfigCreateVariables>(
    (vars) => createSSOConfig(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(orgSSOKeys.orgSSOConfig(slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create SSO configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
