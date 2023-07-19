import toast from 'react-hot-toast'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { isResponseOk, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError, UserContent } from 'types'
import { contentKeys } from './keys'

type UpdateContentVariables = {
  projectRef: string
  id: string
  content: Partial<UserContent>
}

export async function updateContent(
  { projectRef, id, content }: UpdateContentVariables,
  signal?: AbortSignal
) {
  const created = await patch<UserContent[]>(
    `${API_URL}/projects/${projectRef}/content?id=${id}`,
    content,
    { signal }
  )
  if (!isResponseOk(created)) {
    throw created.error
  }

  return { content: created[0] }
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
        await Promise.all([queryClient.invalidateQueries(contentKeys.list(projectRef))])
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
