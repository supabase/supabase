import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectDeleteVariables = {
  projectRef: string
}

export async function deleteProject({ projectRef }: ProjectDeleteVariables) {
  const { data, error } = await del('/platform/projects/{ref}', {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

type ProjectDeleteData = Awaited<ReturnType<typeof deleteProject>>

export const useProjectDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectDeleteData, ResponseError, ProjectDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectDeleteData, ResponseError, ProjectDeleteVariables>(
    (vars) => deleteProject(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(projectKeys.list()),
          await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
