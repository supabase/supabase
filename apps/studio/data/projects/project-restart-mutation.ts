import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectRestartVariables = {
  ref: string
  identifier?: string
}

type RestartProjectBody = components['schemas']['RestartProjectInfo']

export async function restartProject({ ref, identifier }: ProjectRestartVariables) {
  const payload: RestartProjectBody = {}
  if (identifier !== undefined) payload.database_identifier = identifier

  const { data, error } = await post('/platform/projects/{ref}/restart', {
    params: { path: { ref } },
    body: payload,
  })
  if (error) handleError(error)
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
