import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type IntegrationsVercelConnectionSyncEnvsVariables = {
  connectionId: string
}

export async function syncEnvsIntegrationsVercelConnection({
  connectionId,
}: IntegrationsVercelConnectionSyncEnvsVariables) {
  const { data, error } = await post(
    '/platform/integrations/vercel/connections/{connection_id}/sync-envs',
    {
      params: {
        path: { connection_id: connectionId },
      },
    }
  )
  if (error) {
    throw error
  }

  return data
}

type IntegrationsVercelConnectionSyncEnvsData = Awaited<
  ReturnType<typeof syncEnvsIntegrationsVercelConnection>
>

export const useIntegrationsVercelConnectionSyncEnvsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationsVercelConnectionSyncEnvsData,
    ResponseError,
    IntegrationsVercelConnectionSyncEnvsVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    IntegrationsVercelConnectionSyncEnvsData,
    ResponseError,
    IntegrationsVercelConnectionSyncEnvsVariables
  >((vars) => syncEnvsIntegrationsVercelConnection(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to sync environment variables: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
