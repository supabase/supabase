import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'
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

  if ('error' in response) {
    throw response.error
  }

  return { content: response }
}

type CreateContentData = Awaited<ReturnType<typeof createContent>>

export const useContentCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<CreateContentData, unknown, CreateContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateContentData, unknown, CreateContentVariables>(
    (args) => createContent(args),
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
