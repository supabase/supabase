import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { contentKeys } from './keys'
import { ContentType } from './content-query'

type UpdateContentVariables = {
  projectRef: string
  id: string
  type: ContentType
  content: any
  name?: string
  description?: string
}

export async function updateContent(
  { projectRef, id, type, content, name, description }: UpdateContentVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: { id },
    },
    body: { id, type, content, name, description },
    signal,
  })

  if (error) handleError(error)
  return data[0]
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
        await queryClient.invalidateQueries(contentKeys.allContentLists(projectRef))
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
