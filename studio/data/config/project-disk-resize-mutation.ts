import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { usageKeys } from '../usage/keys'

export type ProjectDiskResizeVariables = {
  projectRef: string
  volumeSize: number
}

export type ProjectDiskResizeResponse = {
  error?: any
}

export async function resizeProjectDisk({ projectRef, volumeSize }: ProjectDiskResizeVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const payload = { volume_size_gb: volumeSize }

  const response = (await post(
    `${API_URL}/projects/${projectRef}/resize`,
    payload
  )) as ProjectDiskResizeResponse
  if (response.error) throw response.error

  return response
}

type ProjectDiskResizeData = Awaited<ReturnType<typeof resizeProjectDisk>>

export const useProjectDiskResizeMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ProjectDiskResizeData, unknown, ProjectDiskResizeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectDiskResizeData, unknown, ProjectDiskResizeVariables>(
    (vars) => resizeProjectDisk(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        queryClient.setQueriesData(usageKeys.usage(projectRef), (prev) => {
          if (!prev) return prev

          return {
            ...prev,
            disk_volume_size_gb: variables.volumeSize,
          }
        })

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
