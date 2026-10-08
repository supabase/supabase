import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

type UrlSigningKeyRotateVariables = {
  projectRef?: string
  /** The standby key to promote to the signing key */
  kid: string
}

async function rotateUrlSigningKey({ projectRef, kid }: UrlSigningKeyRotateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!kid) throw new Error('kid is required')

  const { data, error } = await post(
    '/platform/storage/{ref}/jwks/url-signing/standby/{kid}/swap',
    { params: { path: { ref: projectRef, kid } } }
  )

  if (error) handleError(error)
  return data
}

type UrlSigningKeyRotateData = Awaited<ReturnType<typeof rotateUrlSigningKey>>

export const useUrlSigningKeyRotateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UrlSigningKeyRotateData, ResponseError, UrlSigningKeyRotateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UrlSigningKeyRotateData, ResponseError, UrlSigningKeyRotateVariables>({
    mutationFn: (vars) => rotateUrlSigningKey(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.urlSigningKeys(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to rotate URL signing key: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
