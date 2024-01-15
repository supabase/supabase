import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type ProjectPauseVariables = {
  ref: string
}

export async function pauseProject({ ref }: ProjectPauseVariables) {
  const { data, error } = await post('/platform/projects/{ref}/pause', {
    params: { path: { ref } },
  })
  if (error) throw error
  return data
}

type ProjectPauseData = Awaited<ReturnType<typeof pauseProject>>

export const useProjectPauseMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectPauseData, ResponseError, ProjectPauseVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectPauseData, ResponseError, ProjectPauseVariables>(
    (vars) => pauseProject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to pause project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
