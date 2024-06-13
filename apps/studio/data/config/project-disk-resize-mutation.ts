import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectDiskResizeData, ResponseError, ProjectDiskResizeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectDiskResizeData, ResponseError, ProjectDiskResizeVariables>(
    (vars) => resizeProjectDisk(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        queryClient.setQueriesData(usageKeys.usage(projectRef), (prev: any) => {
          if (!prev) return prev
          return { ...prev, disk_volume_size_gb: variables.volumeSize }
        })
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to resize project disk: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
