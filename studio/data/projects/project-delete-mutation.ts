import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectDeleteVariables = {
  projectRef: string
}

export async function deleteProject({ projectRef }: ProjectDeleteVariables) {
  const response = await delete_(`${API_URL}/projects/${projectRef}`)
  if (response.error) throw response.error
  return response
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
