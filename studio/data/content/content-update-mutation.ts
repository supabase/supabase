import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UserContent } from 'types'
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
  if ('error' in created) {
    throw created.error
  }

  return { content: created[0] }
}

type UpdateContentData = Awaited<ReturnType<typeof updateContent>>

export const useContentUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, unknown, UpdateContentVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateContentData, unknown, UpdateContentVariables>(
    (args) => updateContent(args),
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
