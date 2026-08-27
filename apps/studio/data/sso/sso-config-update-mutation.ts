import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { operations } from 'api-types'
import { toast } from 'sonner'

import { orgSSOKeys } from './keys'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type UpdateSSOProviderBody =
  operations['SSOProvidersController_updateSSOProvider']['requestBody']['content']['application/json']

export type SSOConfigUpdateVariables = {
  slug: string
  config: UpdateSSOProviderBody
}

export async function updateSSOConfig({ slug, config }: SSOConfigUpdateVariables) {
  const { data, error } = await put('/platform/organizations/{slug}/sso', {
    params: { path: { slug } },
    body: config,
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
  UseCustomMutationOptions<SSOConfigUpdateData, ResponseError, SSOConfigUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSOConfigUpdateData, ResponseError, SSOConfigUpdateVariables>({
    mutationFn: (vars) => updateSSOConfig(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries({ queryKey: orgSSOKeys.orgSSOConfig(slug) })
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
  })
}
