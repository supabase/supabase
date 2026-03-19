import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { projectKeys } from './keys'
import { useInvalidateProjectsInfiniteQuery } from './org-projects-infinite-query'

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
  const { data, error } = await patch('/platform/projects/{ref}', {
    params: { path: { ref } },
    body: { name },
  })
  if (error) handleError(error)
  return data
}

type ProjectUpdateData = Awaited<ReturnType<typeof updateProject>>

export const useProjectUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ProjectUpdateData, ResponseError, ProjectUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { invalidateProjectsQuery } = useInvalidateProjectsInfiniteQuery()

  return useMutation<ProjectUpdateData, ResponseError, ProjectUpdateVariables>({
    mutationFn: (vars) => updateProject(vars),
    async onSuccess(data, variables, context) {
      const { ref } = variables
      await Promise.all([
        invalidateProjectsQuery(),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(ref) }),
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
  })
}
