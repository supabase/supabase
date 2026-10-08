import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from './keys'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError } from '@/types'

type UrlSigningKeyUpdateVariables = {
  projectRef?: string
  kid: string
  /** `false` revokes the key, `true` reactivates it */
  active: boolean
}

async function updateUrlSigningKey({ projectRef, kid, active }: UrlSigningKeyUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!kid) throw new Error('kid is required')

  const { data, error } = await put('/platform/storage/{ref}/jwks/{kid}', {
    params: { path: { ref: projectRef, kid } },
    body: { active },
  })

  if (error) handleError(error)
  return data
}

type UrlSigningKeyUpdateData = Awaited<ReturnType<typeof updateUrlSigningKey>>

export const useUrlSigningKeyUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UrlSigningKeyUpdateData, ResponseError, UrlSigningKeyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UrlSigningKeyUpdateData, ResponseError, UrlSigningKeyUpdateVariables>({
    mutationFn: (vars) => updateUrlSigningKey(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.urlSigningKeys(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update URL signing key: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
