import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

type DeleteContentVariables = { projectRef: string; ids: string[] }

export async function deleteContents(
  { projectRef, ids }: DeleteContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await del('/platform/projects/{ref}/content', {
    headers: { Version: '2' },
    params: {
      path: { ref: projectRef },
      query: { ids },
    },
    signal,
  })

  if (error) handleError(error)
  return data.map((x) => x.id)
}

type DeleteContentData = Awaited<ReturnType<typeof deleteContents>>

export const useContentDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteContentData, ResponseError, DeleteContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteContentData, ResponseError, DeleteContentVariables>(
    (args) => deleteContents(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(contentKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete contents: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
