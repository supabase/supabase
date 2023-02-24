import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { configKeys } from './keys'

export type ProjectUpgradeVariables = {
  projectRef: string
  targetVersion: number
}

export async function upgradeProject({ projectRef, targetVersion }: ProjectUpgradeVariables) {
  const response = await post(`${API_ADMIN_URL}/projects/${projectRef}/upgrade`, {
    target_version: targetVersion,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type ProjectUpgradeData = Awaited<ReturnType<typeof upgradeProject>>

export const useProjectPostgrestConfigUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ProjectUpgradeData, unknown, ProjectUpgradeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectUpgradeData, unknown, ProjectUpgradeVariables>(
    (vars) => upgradeProject(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        queryClient.invalidateQueries(configKeys.upgradeEligibility(projectRef))

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
