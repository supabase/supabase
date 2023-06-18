import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'

type DeleteVariables = { organization_integration_id: string; id: string }

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

  if (response.error) throw response.error
  return response
}

type DeleteContentData = Awaited<ReturnType<typeof deleteConnection>>

export const useIntegrationsVercelInstalledConnectionDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<DeleteContentData, unknown, DeleteVariables>, 'mutationFn'> = {}) => {
  return useMutation<DeleteContentData, unknown, DeleteVariables>(
    (args) => deleteConnection(args),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
