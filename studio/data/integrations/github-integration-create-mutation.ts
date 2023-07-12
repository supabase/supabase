import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

export type GitHubIntegrationCreateVariables = {
  installationId: string
  orgSlug: string
  metadata: { [key: string]: string }
}

export async function createGitHubIntegration({
  installationId,
  orgSlug,
  metadata,
}: GitHubIntegrationCreateVariables) {
  const response = await post(`${API_URL}/integrations/github`, {
    installation_id: installationId,
    organization_slug: orgSlug,
    metadata,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type GitHubIntegrationCreateData = Awaited<ReturnType<typeof createGitHubIntegration>>

export const useGitHubIntegrationCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<GitHubIntegrationCreateData, unknown, GitHubIntegrationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<GitHubIntegrationCreateData, unknown, GitHubIntegrationCreateVariables>(
    (vars) => createGitHubIntegration(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(integrationKeys.integrationsList()),
          queryClient.invalidateQueries(integrationKeys.integrationsListWithOrg(variables.orgSlug)),
          // queryClient.invalidateQueries(integrationKeys.githubProjectList(data.id)),
        ])
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
