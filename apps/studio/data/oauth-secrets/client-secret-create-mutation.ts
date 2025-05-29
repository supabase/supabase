import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'
import { ResponseError } from 'types'
import { clientSecretKeys } from './keys'

export type ClientSecretCreateVariables = {
  slug: string
  appId: string
}

export async function createClientSecret({ slug, appId }: ClientSecretCreateVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/oauth/apps/{app_id}/client-secrets',
    { params: { path: { slug, app_id: appId } } }
  )
  if (error) handleError(error)
  return data
}

export const useClientSecretCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<any, ResponseError, ClientSecretCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<any, ResponseError, ClientSecretCreateVariables>(
    (vars) => createClientSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug, appId } = variables
        await queryClient.invalidateQueries(clientSecretKeys.list(slug, appId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create client secret: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
