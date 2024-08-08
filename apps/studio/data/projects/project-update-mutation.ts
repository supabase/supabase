import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectUpdateVariables = {
  ref: string
  name: string
}

export type ProjectUpdateResponse = {
  id: number
  ref: string
  name: string
}

export async function updateProject({ ref, name }: ProjectUpdateVariables) {
  const response = await patch(`${API_URL}/projects/${ref}`, { name })
  if (response.error) throw response.error
  return response as ProjectUpdateResponse
}

type ProjectUpdateData = Awaited<ReturnType<typeof updateProject>>

export const useProjectUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectUpdateData, ResponseError, ProjectUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectUpdateData, ResponseError, ProjectUpdateVariables>(
    (vars) => updateProject(vars),
    {
      async onSuccess(data, variables, context) {
        const { ref } = variables
        await Promise.all([
          queryClient.invalidateQueries(projectKeys.list()),
          queryClient.invalidateQueries(projectKeys.detail(ref)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
