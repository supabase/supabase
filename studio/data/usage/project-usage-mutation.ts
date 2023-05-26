import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { usageKeys } from './keys'

export type ProjectUsageVariables = {
  projectRef: string
  volumeSize: number
}

export type ProjectUsageResponse = {
  error?: any
}

export async function updateProjectUsage({ projectRef, volumeSize }: ProjectUsageVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const payload = { volume_size_gb: volumeSize }

  const response = (await post(
    `${API_URL}/projects/${projectRef}/resize`,
    payload
  )) as ProjectUsageResponse
  if (response.error) throw response.error

  return response
}

type ProjectUsageUpdateData = Awaited<ReturnType<typeof updateProjectUsage>>

export const useProjectUsageUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ProjectUsageUpdateData, unknown, ProjectUsageVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectUsageUpdateData, unknown, ProjectUsageVariables>(
    (vars) => updateProjectUsage(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(usageKeys.usage(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
