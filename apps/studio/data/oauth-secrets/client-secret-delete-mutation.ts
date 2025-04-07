import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { del, handleError } from 'data/fetchers'
import { toast } from 'sonner'
import { ResponseError } from 'types'
import { clientSecretKeys } from './keys'

export type ClientSecretDeleteVariables = {
  slug: string
  appId: string
  secretId: string
}

export async function deleteClientSecret({ slug, appId, secretId }: ClientSecretDeleteVariables) {
  const { error } = await del(
    '/platform/organizations/{slug}/oauth/apps/{app_id}/client-secrets/{secret_id}',
    { params: { path: { slug, app_id: appId, secret_id: secretId } } }
  )
  if (error) handleError(error)
  return true
}

export const useClientSecretDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<boolean, ResponseError, ClientSecretDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<boolean, ResponseError, ClientSecretDeleteVariables>(
    (vars) => deleteClientSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug, appId } = variables
        await queryClient.invalidateQueries(clientSecretKeys.list(slug, appId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete client secret: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
