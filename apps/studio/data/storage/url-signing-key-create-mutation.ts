import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { storageKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type UrlSigningKeyAlgorithm = components['schemas']['CreateStandbyJwkBody']['type']

type UrlSigningKeyCreateVariables = {
  projectRef?: string
  algorithm: UrlSigningKeyAlgorithm
}

async function createUrlSigningKey({ projectRef, algorithm }: UrlSigningKeyCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/storage/{ref}/jwks/url-signing/standby', {
    params: { path: { ref: projectRef } },
    body: { type: algorithm },
  })

  if (error) handleError(error)
  return data
}

type UrlSigningKeyCreateData = Awaited<ReturnType<typeof createUrlSigningKey>>

export const useUrlSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UrlSigningKeyCreateData, ResponseError, UrlSigningKeyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UrlSigningKeyCreateData, ResponseError, UrlSigningKeyCreateVariables>({
    mutationFn: (vars) => createUrlSigningKey(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.urlSigningKeys(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create standby key: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
