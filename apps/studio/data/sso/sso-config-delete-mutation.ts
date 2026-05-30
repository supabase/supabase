import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orgSSOKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import { organizationKeys as organizationKeysV1 } from '@/data/organizations/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type SSOConfigDeleteVariables = {
  slug: string
}

export async function deleteSSOConfig({ slug }: SSOConfigDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/sso', {
    params: { path: { slug } },
  })

  if (error) handleError(error)
  return data
}

type SSOConfigDeleteData = Awaited<ReturnType<typeof deleteSSOConfig>>

export const useSSOConfigDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SSOConfigDeleteData, ResponseError, SSOConfigDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSOConfigDeleteData, ResponseError, SSOConfigDeleteVariables>({
    mutationFn: (vars) => deleteSSOConfig(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orgSSOKeys.orgSSOConfig(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeysV1.members(slug) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete SSO configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
