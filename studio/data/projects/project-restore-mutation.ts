import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type ProjectRestoreVariables = {
  ref: string
}

export async function restoreProject({ ref }: ProjectRestoreVariables) {
  const { data, error } = await post('/platform/projects/{ref}/restore', {
    params: { path: { ref } },
    body: {},
  })
  if (error) throw error
  return data
}

type ProjectRestoreData = Awaited<ReturnType<typeof restoreProject>>

export const useProjectRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectRestoreData, ResponseError, ProjectRestoreVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectRestoreData, ResponseError, ProjectRestoreVariables>(
    (vars) => restoreProject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to restore project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
