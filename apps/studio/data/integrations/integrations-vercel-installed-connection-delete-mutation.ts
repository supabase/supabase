import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

type DeleteVariables = {
  id: string
  organization_integration_id: string
  orgSlug: string | undefined
}

export async function deleteConnection(
  { organization_integration_id, id }: DeleteVariables,
  signal?: AbortSignal
) {
  if (!organization_integration_id) throw new Error('organization_integration_id is required')

  const { data, error } = await del('/platform/integrations/vercel/connections/{connection_id}', {
    params: { path: { connection_id: id } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type DeleteContentData = Awaited<ReturnType<typeof deleteConnection>>

export const useIntegrationsVercelInstalledConnectionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteContentData, ResponseError, DeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DeleteContentData, ResponseError, DeleteVariables>(
    (args) => deleteConnection(args),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(integrationKeys.integrationsList()),
          queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
          queryClient.invalidateQueries(
            integrationKeys.vercelProjectList(variables.organization_integration_id)
          ),
          queryClient.invalidateQueries(
            integrationKeys.vercelConnectionsList(variables.organization_integration_id)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete Vercel connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
