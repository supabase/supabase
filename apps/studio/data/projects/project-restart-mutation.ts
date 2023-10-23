import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type ProjectRestartVariables = {
  ref: string
}

export async function restartProject({ ref }: ProjectRestartVariables) {
  const { data, error } = await post('/platform/projects/{ref}/restart', {
    params: { path: { ref } },
  })
  if (error) throw error
  return data
}

type ProjectRestartData = Awaited<ReturnType<typeof restartProject>>

export const useProjectRestartMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectRestartData, ResponseError, ProjectRestartVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectRestartData, ResponseError, ProjectRestartVariables>(
    (vars) => restartProject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to restart project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
