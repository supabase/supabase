import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { usageKeys } from '../usage/keys'

export type ProjectDiskResizeVariables = {
  projectRef: string
  volumeSize: number
}

export async function resizeProjectDisk({ projectRef, volumeSize }: ProjectDiskResizeVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const payload = { volume_size_gb: volumeSize }

  const { data, error } = await post('/platform/projects/{ref}/resize', {
    params: { path: { ref: projectRef } },
    body: payload,
  })
  if (error) handleError(error)
  return data
}

type ProjectDiskResizeData = Awaited<ReturnType<typeof resizeProjectDisk>>

/**
 * @deprecated We'll need to use the new endpoint instead
 * @param param0
 * @returns
 */
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
