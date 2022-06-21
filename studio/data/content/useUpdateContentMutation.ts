import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useMutation, UseMutationOptions } from 'react-query'
import { UserContent } from 'types'

/* Update Content */

type UpdateContentVariables = {
  projectRef: string
  id: string
  content: UserContent
}

export async function updateContent(
  { projectRef, id, content }: UpdateContentVariables,
  signal?: AbortSignal
) {
  const created = await post<UserContent>(
    `${API_URL}/projects/${projectRef}/content?id=${id}`,
    content,
    { signal }
  )
  if (created.error) {
    throw created.error
  }

  return { content: created }
}

type UpdateContentData = Awaited<ReturnType<typeof updateContent>>

export const useUpdateContentMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, unknown, UpdateContentVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UpdateContentData, unknown, UpdateContentVariables>(
    (args) => updateContent(args),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
