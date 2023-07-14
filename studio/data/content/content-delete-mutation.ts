import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'
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

  if ('error' in response) {
    throw response.error
  }

  return response
}

type DeleteContentData = Awaited<ReturnType<typeof deleteContent>>

export const useContentDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<DeleteContentData, unknown, DeleteContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteContentData, unknown, DeleteContentVariables>(
    (args) => deleteContent(args),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([queryClient.invalidateQueries(contentKeys.list(projectRef))])

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
