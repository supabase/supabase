import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'data/fetchers'

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
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationsVercelConnectionSyncEnvsData,
    unknown,
    IntegrationsVercelConnectionSyncEnvsVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IntegrationsVercelConnectionSyncEnvsData,
    unknown,
    IntegrationsVercelConnectionSyncEnvsVariables
  >((vars) => syncEnvsIntegrationsVercelConnection(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
