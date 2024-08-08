import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'

type UpdateContentVariables = { projectRef: string; id: string; type: 'report'; content: any }

export async function updateContent(
  { projectRef, id, type, content }: UpdateContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/projects/{ref}/content', {
    params: {
      // @ts-ignore API codegen issue
      path: { ref: projectRef },
      query: { id },
    },
    body: { id, type, content },
    signal,
  })

  if (error) handleError(error)
  return data
}

type UpdateContentData = Awaited<ReturnType<typeof updateContent>>

export const useContentUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, ResponseError, UpdateContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateContentData, ResponseError, UpdateContentVariables>(
    (args) => updateContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(contentKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update content: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
