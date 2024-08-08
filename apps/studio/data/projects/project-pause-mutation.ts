import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectPauseVariables = {
  ref: string
}

export async function pauseProject({ ref }: ProjectPauseVariables) {
  const { data, error } = await post('/platform/projects/{ref}/pause', {
    params: { path: { ref } },
  })
  if (error) handleError(error)
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
