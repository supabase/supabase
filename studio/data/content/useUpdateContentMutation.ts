import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'

/* Update Content */

type UpdateContentVariables = {
  projectRef: string
  id: string
  content: Partial<UserContent>
}

export async function updateContent(
  { projectRef, id, content }: UpdateContentVariables,
  signal?: AbortSignal
) {
  const created = await patch<UserContent>(
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
