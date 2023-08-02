import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { UpdateConnection } from './integrations.types'
import { integrationKeys } from './keys'

export async function updateVercelConnection({
  id,
  metadata,
  organizationIntegrationId,
}: UpdateConnection) {
  const { data, error } = await patch('/platform/integrations/vercel/connections/{connection_id}', {
    params: {
      path: { connection_id: id },
    },
    body: {
      metadata,
    },
  })

  if (error) throw error
  return data
}

type UpdateVercelConnectionData = Awaited<ReturnType<typeof updateVercelConnection>>

export const useVercelConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateVercelConnectionData, ResponseError, UpdateConnection>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateVercelConnectionData, ResponseError, UpdateConnection>(
    (vars) => updateVercelConnection(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.vercelConnectionsList(variables.organizationIntegrationId)
          ),
        ])
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
