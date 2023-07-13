import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { post } from 'data/fetchers'
import { integrationKeys } from './keys'

export type GitHubIntegrationCreateVariables = {
  installationId: number
  orgSlug: string
  metadata: { [key: string]: string }
}

export async function createGitHubIntegration({
  installationId,
  orgSlug,
  metadata,
}: GitHubIntegrationCreateVariables) {
  const { data, error } = await post('/platform/integrations/github', {
    body: {
      installation_id: installationId,
      organization_slug: orgSlug,
      metadata: metadata as any,
    },
  })
  if (error) throw error

  return data
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
          queryClient.invalidateQueries(integrationKeys.githubRepoList(data.id)),
        ])
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
