import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { orgSSOKeys } from './keys'

export type SSOConfigUpdateVariables = {
  slug: string
  config: Partial<components['schemas']['UpdateSSOProviderBody']>
}

export async function updateSSOConfig({ slug, config }: SSOConfigUpdateVariables) {
  const { data, error } = await put('/platform/organizations/{slug}/sso', {
    params: { path: { slug } },
    body: config as components['schemas']['UpdateSSOProviderBody'],
  })

  if (error) handleError(error)
  return data
}

type SSOConfigUpdateData = Awaited<ReturnType<typeof updateSSOConfig>>

export const useSSOConfigUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SSOConfigUpdateData, ResponseError, SSOConfigUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSOConfigUpdateData, ResponseError, SSOConfigUpdateVariables>(
    (vars) => updateSSOConfig(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(orgSSOKeys.orgSSOConfig(slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          if (data.message === '') {
            toast.error(`Failed to update SSO configuration.`)
          } else {
            toast.error(`${data.message}`)
          }
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
