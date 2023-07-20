import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { isResponseOk, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError, UserContent } from 'types'
import { contentKeys } from './keys'

type CreateContentVariables = {
  projectRef: string
  payload: UserContent
}

export async function createContent(
  { projectRef, payload }: CreateContentVariables,
  signal?: AbortSignal
) {
  const response = await post<UserContent[]>(`${API_URL}/projects/${projectRef}/content`, payload, {
    signal,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return { content: response }
}

type CreateContentData = Awaited<ReturnType<typeof createContent>>

export const useContentCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateContentData, ResponseError, CreateContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateContentData, ResponseError, CreateContentVariables>(
    (args) => createContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await Promise.all([queryClient.invalidateQueries(contentKeys.list(projectRef))])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create content: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
