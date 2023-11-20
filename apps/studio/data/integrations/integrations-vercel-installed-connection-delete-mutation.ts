import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError, UserContent } from 'types'
import { integrationKeys } from './keys'
import { toast } from 'react-hot-toast'

type DeleteVariables = {
  id: string
  organization_integration_id: string
  orgSlug: string | undefined
}

export async function deleteConnection(
  { organization_integration_id, id }: DeleteVariables,
  signal?: AbortSignal
) {
  if (!organization_integration_id) {
    throw new Error('organization_integration_id is required')
  }

  const response = await delete_<UserContent>(
    `${API_URL}/integrations/vercel/connections/${id}`,
    { organization_integration_id },
    { signal }
  )

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
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
