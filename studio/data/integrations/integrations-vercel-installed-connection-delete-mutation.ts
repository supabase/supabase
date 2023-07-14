import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'
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
  ...options
}: Omit<UseMutationOptions<DeleteContentData, unknown, DeleteVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DeleteContentData, unknown, DeleteVariables>(
    (args) => deleteConnection(args),
    {
      async onSuccess(data, variables, context) {
        console.log('variables in mutate delete onSuccess', variables)
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
      ...options,
    }
  )
}
