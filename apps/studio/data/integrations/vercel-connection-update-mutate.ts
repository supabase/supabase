import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { UpdateConnectionPayload } from './integrations.types'
import { integrationKeys } from './keys'

export async function updateVercelConnection({
  id,
  envSyncTargets,
  publicEnvVarPrefix,
}: UpdateConnectionPayload) {
  const { data, error } = await patch('/platform/integrations/vercel/connections/{connection_id}', {
    params: {
      path: { connection_id: id },
    },
    body: {
      env_sync_targets: envSyncTargets,
      public_env_var_prefix: publicEnvVarPrefix,
    },
  })

  if (error) handleError(error)
  return data
}

type UpdateVercelConnectionData = Awaited<ReturnType<typeof updateVercelConnection>>

export const useVercelConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateVercelConnectionData, ResponseError, UpdateConnectionPayload>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateVercelConnectionData, ResponseError, UpdateConnectionPayload>(
    (vars) => updateVercelConnection(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(
          integrationKeys.vercelConnectionsList(variables.organizationIntegrationId)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update Vercel connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
