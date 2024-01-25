import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { delete_, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError, UserContent } from 'types'
import { contentKeys } from './keys'

type DeleteContentVariables = { projectRef: string; id: string }

export async function deleteContent(
  { projectRef, id }: DeleteContentVariables,
  signal?: AbortSignal
) {
  const response = await delete_<UserContent>(
    `${API_URL}/projects/${projectRef}/content?id=${id}`,
    undefined,
    { signal }
  )

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type DeleteContentData = Awaited<ReturnType<typeof deleteContent>>

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
    (args) => deleteContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await Promise.all([queryClient.invalidateQueries(contentKeys.list(projectRef))])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete content: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
